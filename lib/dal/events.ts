import { NotificationService } from "@/lib/services/notifications";
import { emailQueue } from "@/lib/queues/email";
import { generateSignedPass, HMACPassValidator } from "@/lib/passes/qr";
import { nanoid } from "nanoid";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { events, registrations, user , eventSessions , sessionAttendance , notifications , budgets , expenses , inventory , inventoryLogs } from "@/lib/db/schema";
import { eq, ilike, desc, asc, sql, and, gte, lte, or } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";
import { aiQueue } from "@/lib/queues/ai";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { isManagementRole, getUserDomain, checkEmergencyFreeze, canTransition, requireRole } from "@/lib/dal/auth";
import type { AuthSession } from "@/lib/dal/auth";
import { createDefaultEventTasks } from "@/lib/services/tasks";

export async function getEvents(session: AuthSession, filters: {
  page?: number;
  limit?: number;
  search?: string | null;
  type?: string | null;
  status?: string | null;
  domain?: string | null;
  upcoming?: string | null;
}) {
  const isManagement = isManagementRole(session.user.role as string);
  const isAdmin = ["admin", "owner"].includes(session.user.role as string);

  // Get user domain if they are a siloed lead
  let userDomain: string | null = null;
  if (isManagement && !isAdmin) {
    userDomain = await getUserDomain(session.user.id, session.user.role as string);
  }

  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (filters.search) {
    conditions.push(ilike(events.title, `%${filters.search}%`));
  }
  if (filters.type) {
    conditions.push(eq(events.type, filters.type as "hackathon" | "workshop" | "seminar" | "social" | "competition"));
  }
  if (!isManagement) {
    conditions.push(eq(events.status, "published"));
  } else if (filters.status) {
    conditions.push(eq(events.status, filters.status as "draft" | "published" | "cancelled" | "completed"));
  }
  
  if (userDomain) {
    conditions.push(eq(events.domain, userDomain));
  } else if (filters.domain) {
    conditions.push(eq(events.domain, filters.domain));
  }
  
  if (filters.upcoming === "true") {
    conditions.push(gte(events.startsAt, new Date()));
  }

  let query = db.select().from(events);
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(events);

  if (conditions.length > 0) {
    const combinedCondition = and(...conditions);
    query = query.where(combinedCondition) as typeof query;
    countQuery = countQuery.where(combinedCondition) as typeof countQuery;
  }

  const allEvents = await (query as any)
    .orderBy(desc(events.startsAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await countQuery;

  return {
    events: allEvents,
    pagination: {
      page,
      limit,
      total: Number(countResult.count),
      totalPages: Math.ceil(Number(countResult.count) / limit),
    },
  };
}

export async function createEvent(session: AuthSession, data: any) {
  const role = session.user.role as string;
  const allowedRoles = ["lead", "co_lead", "admin", "owner"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to create events.");
  }

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const userDomain = await getUserDomain(session.user.id, role);
    if (data.domain && data.domain !== userDomain) {
      throw new AuthorizationError("You can only create events within your own domain.");
    }
    if (!data.domain && userDomain) {
      data.domain = userDomain; // Auto-assign domain if they have one
    }
  }

  await checkEmergencyFreeze(role);

  // Generate slug from title
  const slug = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + crypto.randomBytes(3).toString("hex");

  const eventId = crypto.randomUUID();
  const isDraft = ["lead", "co_lead", "vice_lead", "volunteer_lead"].includes(role);

  await db.insert(events).values({
    id: eventId,
    title: data.title,
    slug,
    type: data.type,
    domain: data.domain || null,
    description: data.description,
    location: data.location || null,
    capacity: data.capacity || null,
    startsAt: new Date(data.startsAt),
    endsAt: new Date(data.endsAt),
    registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
    isPaid: data.isPaid,
    price: data.price ? String(data.price) : null,
    visibility: data.visibility,
    coverImage: data.coverImage || null,
    isInternal: data.isInternal || false,
    status: isDraft ? "draft" : "published",
    metadata: {
      approvalStatus: isDraft ? "pending" : "approved",
      attendanceEstimates: data.attendanceEstimates || null,
    },
    createdBy: session.user.id,
  });

  // Trigger default tasks generation
  await createDefaultEventTasks(eventId, data.type || "workshop", data.isInternal || false);

  await logAuditEvent({
    actorId: session.user.id,
    action: "event_create",
    entity: "event",
    entityId: eventId,
    details: `Created event: ${data.title}`,
  });

  try {
    // Enqueue AI job to draft comms (WhatsApp & Email)
    await aiQueue.add("draft_event_comms", {
      eventId,
      eventDetails: {
        title: data.title,
        type: data.type,
        description: data.description,
        startsAt: data.startsAt,
        location: data.location,
        isInternal: data.isInternal,
      }
    });
  } catch (error) {
    console.warn("Failed to enqueue draft_event_comms (is Redis running?)", error);
  }

  return { success: true, id: eventId, slug };
}

export async function getEventById(session: AuthSession, id: string) {
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);

  if (!event) {
    return null;
  }

  const isManagement = isManagementRole(session.user.role as string);
  if (event.status !== "published" && !isManagement) {
    throw new AuthorizationError("Forbidden");
  }

  return event;
}

export async function updateEvent(session: AuthSession, id: string, data: any) {
  const role = session.user.role as string;
  const allowedRoles = ["lead", "co_lead", "admin", "owner"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to update events.");
  }
  await checkEmergencyFreeze(role as any);

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) {
    return null;
  }

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const userDomain = await getUserDomain(session.user.id, role);
    const isCreator = event.createdBy === session.user.id;
    
    // A lead can edit if they created it OR if it belongs to their domain.
    // co_leads can ONLY edit if they created it.
    if (role === "co_lead" && !isCreator) {
      throw new AuthorizationError("You can only edit events you created");
    } else if (role === "lead" && !isCreator && event.domain !== userDomain) {
      throw new AuthorizationError("You can only edit events within your domain");
    }

    if (data.domain !== undefined && data.domain !== userDomain) {
      throw new AuthorizationError("You cannot move an event to a domain you do not belong to");
    }
  }

  const updateData: Record<string, any> = {};
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.domain !== undefined) updateData.domain = data.domain;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
  if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
  if (data.price !== undefined) updateData.price = String(data.price);
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  
  if (data.status !== undefined) {
    if (!canTransition(role as any, "event", event.status || "draft", data.status)) {
      throw new AuthorizationError("Your role cannot transition the event to this status");
    }
    updateData.status = data.status;
  }

  if (Object.keys(updateData).length === 0) {
    throw new ValidationError("No fields to update");
  }

  await db.update(events).set(updateData).where(eq(events.id, id));

  await logAuditEvent({
    actorId: session.user.id,
    action: "event_update",
    entity: "event",
    entityId: id,
    details: `Updated fields: ${Object.keys(updateData).join(", ")}`,
  });

  if (event.status === "published") {
    const attendees = await db
      .select({ email: user.email, name: user.name })
      .from(registrations)
      .innerJoin(user, eq(registrations.userId, user.id))
      .where(eq(registrations.eventId, id));

    if (attendees.length > 0) {
      const { Mailer } = await import("@/lib/services/mailer");
      const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Event Update: ${updateData.title || event.title}</h2>
              <p>This is to notify you that there have been updates to an event you registered for.</p>
              <p>Please check the latest details on the event page.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/events/${event.slug}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Event Details</a>
            </div>
          `;

      Promise.allSettled(
        attendees.map(a => 
          Mailer.sendEmail({
            to: a.email,
            subject: `Event Update: ${updateData.title || event.title}`,
            html: emailHtml
          })
        )
      ).catch(console.error);
    }
  }

  return { success: true, event: { slug: event.slug } };
}

export async function deleteEvent(session: AuthSession, id: string) {
  const role = session.user.role as string;
  const allowedRoles = ["admin", "owner"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to cancel events.");
  }
  await checkEmergencyFreeze(role);

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) {
    return null;
  }

  await db.update(events).set({ status: "cancelled" }).where(eq(events.id, id));

  await logAuditEvent({
    actorId: session.user.id,
    action: "event_delete",
    entity: "event",
    entityId: id,
    details: `Cancelled event: ${event.title}`,
  });

  return { success: true, message: "Event cancelled" };
}

export async function approveEvent(session: AuthSession, id: string) {
  const role = session.user.role as string;
  const allowedRoles = ["admin", "owner"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to approve events.");
  }
  
  await db.update(events).set({ status: "published" }).where(eq(events.id, id));
  
  await logAuditEvent({
    actorId: session.user.id,
    action: "event_approve",
    entity: "event",
    entityId: id,
    details: `Approved event ${id}`,
  });
  
  return { success: true };
}

export async function archiveEvent(session: AuthSession, id: string) {
  if (!isManagementRole(session.user.role as string)) {
    throw new AuthorizationError("Unauthorized");
  }
  
  await db.update(events).set({ status: "cancelled" }).where(eq(events.id, id));
  
  await logAuditEvent({
    actorId: session.user.id,
    action: "event_archive" as any,
    entity: "event",
    entityId: id,
    details: `Archived event ${id}`,
  });
  
  return { success: true };
}

export async function rejectEvent(session: AuthSession, id: string, reason: string) {
  const role = session.user.role as string;
  const allowedRoles = ["admin", "owner"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to reject events.");
  }
  
  await db.update(events)
    .set({ 
      status: "cancelled", 
      aiDraftMessage: `REJECTED: ${reason}` 
    })
    .where(eq(events.id, id));
    
  await logAuditEvent({
    actorId: session.user.id,
    action: "event_reject" as any,
    entity: "event",
    entityId: id,
    details: `Rejected event ${id}: ${reason}`,
  });
  
  return { success: true };
}


export async function duplicateEvent(session: AuthSession, eventId: string) {
  if (!isManagementRole(session.user.role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const existing = await db.select().from(events).where(eq(events.id, eventId));
  if (!existing || existing.length === 0) {
    throw new ValidationError("Event not found");
  }

  const e = existing[0];
  const newSlug = `${e.slug}-copy-${Date.now()}`;
  const newTitle = `Copy of ${e.title}`;

  const inserted = await db.insert(events).values({
    ...e,
    id: undefined, 
    title: newTitle,
    slug: newSlug,
    status: "draft", 
    createdAt: undefined,
    updatedAt: undefined,
  }).returning();

  return inserted[0];
}

export async function exportEventAttendees(sessionAuth: AuthSession, eventId: string) {
  const role = sessionAuth.user.role as string;
  if (!["co_lead", "lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const userDomain = await getUserDomain(sessionAuth.user.id, role);
    if (event.domain !== userDomain) {
      throw new AuthorizationError("Forbidden: Event is outside your domain");
    }
  }

  const attendees = await db
    .select({
      name: user.name,
      email: user.email,
      branch: user.branch,
      year: user.year,
      status: registrations.status,
      checkedInAt: registrations.checkedInAt,
      attendanceMethod: registrations.attendanceMethod,
    })
    .from(registrations)
    .innerJoin(user, eq(registrations.userId, user.id))
    .where(eq(registrations.eventId, eventId));

  const csvContent = Papa.unparse(attendees);
  return { csvContent, eventSlug: event.slug };
}

export async function importEventAttendees(sessionAuth: AuthSession, eventId: string, csvText: string) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner", "lead", "event_lead", "co_lead"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }
  await checkEmergencyFreeze(role);

  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    throw new ValidationError("Failed to parse CSV");
  }

  const rows = parsed.data as Array<{ name?: string, email?: string, status?: string }>;
  const validRows = rows.filter(r => r.email); 

  if (validRows.length === 0) {
    throw new ValidationError("No valid rows with 'email' column found");
  }

  let importedCount = 0;
  const errors = [];
  
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i];
    const rowNumber = i + 1; // 1-indexed for user readability
    
    try {
      const email = row.email?.trim().toLowerCase();
      const name = row.name?.trim() || "Unknown";
      const rawStatus = row.status?.trim().toLowerCase();
      const status = (["confirmed", "waitlist", "checked_in", "cancelled", "no_show"].includes(rawStatus || "") ? rawStatus : "confirmed") as "confirmed" | "waitlist" | "checked_in" | "cancelled" | "no_show";
      
      if (!email) {
        errors.push({ rowNumber, error: "Missing email" });
        continue;
      }

      // Check for valid email format roughly
      if (!email.includes("@")) {
        errors.push({ rowNumber, error: "Invalid email format" });
        continue;
      }

      await db.transaction(async (tx) => {
        let [existingUser] = await tx.select().from(user).where(eq(user.email, email)).limit(1);
        
        if (!existingUser) {
          const newUserId = nanoid();
          [existingUser] = await tx.insert(user).values({
            id: newUserId,
            name,
            email,
            emailVerified: false,
            role: "member",
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();
        }

        const [existingReg] = await tx.select().from(registrations).where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.userId, existingUser.id)
          )
        ).limit(1);

        if (!existingReg) {
          await tx.insert(registrations).values({
            id: nanoid(),
            eventId,
            userId: existingUser.id,
            passCode: nanoid(10),
            status,
            createdAt: new Date(),
          });
          importedCount++;
        } else {
          // Already registered, we can treat this as a skipped row error or just ignore
          errors.push({ rowNumber, error: `User ${email} is already registered` });
        }
      });
    } catch (error: any) {
      errors.push({ rowNumber, error: error.message || "Unknown database error" });
    }
  }

  return { imported: importedCount, total: validRows.length, errors };
}

export async function updatePostEventDetails(sessionAuth: AuthSession, eventId: string, data: { report?: string; driveLink?: string }) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const { report, driveLink } = data;

  if (!report && !driveLink) {
    throw new ValidationError("Provide at least a report or a driveLink");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const userDomain = await getUserDomain(sessionAuth.user.id, role);
    if (event.domain !== userDomain) {
      throw new AuthorizationError("Forbidden: Event is outside your domain");
    }
  }

  const metadata = (event.metadata as Record<string, any>) || {};

  const updatedMetadata = {
    ...metadata,
    postEventReport: report || metadata.postEventReport,
    driveLink: driveLink || metadata.driveLink,
  };

  const [updatedEvent] = await db.update(events)
    .set({
      metadata: updatedMetadata,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  await logAuditEvent({
    actorId: sessionAuth.user.id,
    action: "event_post_event_update",
    entity: "event",
    entityId: eventId,
    details: `Updated post-event details for event: ${updatedEvent.title}`,
  });

  return { success: true, event: updatedEvent };
}

export async function scheduleMeeting(sessionAuth: AuthSession, eventId: string, data: { title: string; description?: string; startTime: string; endTime: string; meetingLink: string }) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const { title, description, startTime, endTime, meetingLink } = data;

  if (!title || !startTime || !endTime || !meetingLink) {
    throw new ValidationError("Missing required fields");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const userDomain = await getUserDomain(sessionAuth.user.id, role);
    if (event.domain !== userDomain) {
      throw new AuthorizationError("Forbidden: Event is outside your domain");
    }
  }

  const sessionId = crypto.randomUUID();
  await db.insert(eventSessions).values({
    id: sessionId,
    eventId,
    title: `[Internal Meeting] ${title}`,
    description: description || null,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    location: meetingLink,
  });

  const colleagues = await db.select({ id: user.id })
    .from(user)
    .where(
      or(
        ilike(user.role, "%lead%"),
        eq(user.role, "admin"),
        eq(user.role, "owner")
      )
    );

  const notifs = colleagues.map(c => ({
    id: crypto.randomUUID(),
    userId: c.id,
    type: "internal_meeting",
    title: `Internal Meeting: ${title}`,
    message: `A new internal meeting has been scheduled for ${event.title}. Link: ${meetingLink}`,
    link: `/events/${event.slug}/management`,
  }));

  if (notifs.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < notifs.length; i += chunkSize) {
      await db.insert(notifications).values(notifs.slice(i, i + chunkSize));
    }
  }

  await logAuditEvent({
    actorId: sessionAuth.user.id,
    action: "event_meeting_schedule",
    entity: "eventSessions",
    entityId: sessionId,
    details: `Scheduled internal meeting for event: ${eventId}`,
  });

  return { success: true, sessionId };
}

export async function registerForEvent(session: AuthSession, eventId: string, formResponses: any = null) {
  const result = await db.transaction(async (tx) => {
    const { rows } = await tx.execute(
      sql`SELECT * FROM ${events} WHERE id = ${eventId} FOR UPDATE`
    );
    const event = rows[0] as any;

    if (!event) return { error: "Event not found", status: 404 };
    if (event.status !== "published") return { error: "Event is not open for registration", status: 400 };
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return { error: "Registration deadline has passed", status: 400 };
    }

    const [existingReg] = await tx.select()
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.userId, session.user.id)))
      .limit(1);

    if (existingReg && existingReg.status !== "cancelled") {
      return { error: "Already registered for this event", status: 400, regStatus: existingReg.status };
    }

    const [countResult] = await tx.select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "confirmed")));

    const confirmedCount = Number(countResult.count);
    const hasCapacity = !event.capacity || confirmedCount < event.capacity;

    const regStatus = hasCapacity ? "confirmed" : "waitlist";
    const passCode = crypto.randomBytes(8).toString("hex");
    const regId = existingReg?.id || crypto.randomUUID();

    if (existingReg) {
      await tx.update(registrations)
        .set({ status: regStatus, passCode, formResponses })
        .where(eq(registrations.id, regId));
    } else {
      await tx.insert(registrations).values({
        id: regId,
        eventId,
        userId: session.user.id,
        status: regStatus,
        passCode,
        formResponses,
      });
    }

    return { success: true, event, regId, regStatus, passCode, confirmedCount };
  });

  if (result.error) return result;

  const { event, regId, regStatus, passCode, confirmedCount } = result;
  let passToken: string | null = null;
  if (regStatus === "confirmed") {
    passToken = generateSignedPass({
      eventId,
      userId: session.user.id,
      passCode: passCode as string,
    });
  }

  await logAuditEvent({
    actorId: session.user.id,
    action: "registration_create",
    entity: "registration",
    entityId: regId as string,
    details: `Registered for event "${event.title}" with status: ${regStatus}`,
  });

  if (regStatus === "confirmed" && passToken) {
    void emailQueue.add("send-qr-pass", {
      type: "event_registration",
      payload: {
        email: session.user.email,
        eventTitle: event.title,
        qrCodeDataUrl: passToken,
      }
    }, { jobId: crypto.createHash("sha256").update(`event_registration:${regId}`).digest("hex") });
  }

  void NotificationService.sendInAppNotification({
    userId: session.user.id,
    type: "event",
    title: regStatus === "confirmed" ? "Registration Confirmed" : "Added to Waitlist",
    message: regStatus === "confirmed"
      ? `You're registered for "${event.title}". Your QR pass is ready.`
      : `You've been added to the waitlist for "${event.title}".`,
    link: `/events/${event.slug}`,
  });

  return {
    success: true,
    registrationId: regId,
    status: regStatus,
    passToken,
    message: regStatus === "confirmed"
      ? "Registration confirmed! Your QR pass is ready."
      : `You're on the waitlist (position ${(confirmedCount || 0) - (event.capacity || 0) + 1}).`,
  };
}

export async function deregisterEvent(session: AuthSession, eventId: string) {
  const registration = await db.query.registrations.findFirst({
    where: and(eq(registrations.eventId, eventId), eq(registrations.userId, session.user.id))
  });

  if (!registration) throw new ValidationError("Registration not found");
  if (registration.status === "cancelled") throw new ValidationError("Already cancelled");

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) throw new ValidationError("Event not found");
  if (new Date() >= new Date(event.startsAt)) {
    throw new ValidationError("Cannot deregister after event has started");
  }

  const wasPreviouslyConfirmed = registration.status === "confirmed";

  await db.update(registrations).set({ status: "cancelled" }).where(eq(registrations.id, registration.id));

  await logAuditEvent({
    actorId: session.user.id,
    action: "event_deregister",
    entity: "registration",
    entityId: registration.id,
    details: `User deregistered from event: ${event.title}`,
  });

  void NotificationService.sendInAppNotification({
    userId: session.user.id,
    type: "event",
    title: "Registration Cancelled",
    message: `Your registration for "${event.title}" has been cancelled.`,
    link: `/events/${event.slug}`,
  });

  if (wasPreviouslyConfirmed && event.capacity) {
    const [confirmedCount] = await db.select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "confirmed")));

    if (Number(confirmedCount.count) < event.capacity) {
      const nextInLine = await db.select()
        .from(registrations)
        .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "waitlist")))
        .orderBy(asc(registrations.createdAt))
        .limit(1);

      if (nextInLine.length > 0) {
        await db.update(registrations).set({ status: "confirmed" }).where(eq(registrations.id, nextInLine[0].id));

        void NotificationService.sendInAppNotification({
          userId: nextInLine[0].userId,
          type: "event",
          title: "Waitlist Promotion! 🎉",
          message: `A spot opened up! You've been promoted from the waitlist for "${event.title}".`,
          link: `/events/${event.slug}`,
        });

        await logAuditEvent({
          actorId: "system",
          action: "waitlist_promotion",
          entity: "registration",
          entityId: nextInLine[0].id,
          details: `Auto-promoted user ${nextInLine[0].userId} from waitlist for event: ${event.title}`,
        });
      }
    }
  }

  return { success: true, message: "Successfully deregistered" };
}

export async function walkInRegister(session: AuthSession, eventId: string, data: { name: string, email: string }) {
  const role = session.user.role as string;
  const allowedRoles = ["admin", "owner", "lead", "event_lead", "co_lead", "faculty_coordinator"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to perform walk-in registrations.");
  }
  
  await checkEmergencyFreeze(role);

  const { name, email } = data;

  const result = await db.transaction(async (tx) => {
    // 1. Find or create user
    let [existingUser] = await tx.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (!existingUser) {
      const newUserId = nanoid();
      [existingUser] = await tx.insert(user).values({
        id: newUserId,
        name,
        email,
        emailVerified: false,
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    }

    // 2. Check if already registered
    const [existingReg] = await tx.select().from(registrations).where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.userId, existingUser.id)
      )
    ).limit(1);

    if (existingReg) {
      if (existingReg.status === "checked_in") {
        return { reg: existingReg, status: "already_checked_in" };
      }
      
      const [updatedReg] = await tx.update(registrations)
        .set({ status: "checked_in", checkedInAt: new Date() })
        .where(eq(registrations.id, existingReg.id))
        .returning();
        
      return { reg: updatedReg, status: "updated_to_checked_in" };
    }

    // 3. Create new walk-in registration
    const newRegId = nanoid();
    const passCode = nanoid(10);
    
    const [newReg] = await tx.insert(registrations).values({
      id: newRegId,
      eventId,
      userId: existingUser.id,
      passCode,
      status: "checked_in",
      checkedInAt: new Date(),
      createdAt: new Date(),
    }).returning();

    return { reg: newReg, status: "new_walk_in" };
  });

  return result;
}

export async function guestRegister(eventId: string, data: { name: string, email: string }) {
  const { name, email } = data;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) throw new ValidationError("Event not found");
  if (event.visibility === "private") throw new AuthorizationError("Cannot register for a private event");

  // Find or create guest user
  let guestUser = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!guestUser) {
    const userId = crypto.randomUUID();
    const [newUser] = await db.insert(user).values({
      id: userId,
      name,
      email,
      emailVerified: false,
      role: "outsider",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    guestUser = newUser;
  }

  // Check if already registered
  const existingReg = await db.query.registrations.findFirst({
    where: and(
      eq(registrations.eventId, eventId),
      eq(registrations.userId, guestUser.id)
    )
  });

  if (existingReg) {
    throw new ValidationError("Already registered for this event");
  }

  // Generate passcode
  const passCode = crypto.randomBytes(4).toString("hex").toUpperCase();
  const regId = crypto.randomUUID();

  await db.insert(registrations).values({
    id: regId,
    eventId,
    userId: guestUser.id,
    status: "confirmed",
    passCode,
  });

  return { passCode, regId };
}

export async function scanEventPass(session: AuthSession, eventId: string, passCode: string) {
  const role = session.user.role as string;
  const allowedRoles = ["admin", "owner", "lead", "event_lead", "co_lead", "faculty_coordinator"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to scan passes.");
  }

  const res = await db.update(registrations)
    .set({ status: 'checked_in', checkedInAt: new Date() })
    .where(
      and(
        eq(registrations.eventId, eventId), 
        eq(registrations.passCode, passCode), 
        eq(registrations.status, 'confirmed')
      )
    )
    .returning();
    
  if (res.length === 0) {
    const existing = await db.select().from(registrations).where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.passCode, passCode)
      )
    ).limit(1);

    if (existing.length > 0 && existing[0].status === 'checked_in') {
      return { success: true, message: "Already checked in", alreadyCheckedIn: true };
    }

    throw new ValidationError("Invalid QR code or registration not confirmed");
  }

  return { success: true, message: "Check-in successful" };
}

export async function checkInEvent(session: AuthSession, slug: string, signedPass: string) {
  if (!["owner", "admin", "lead", "co_lead"].includes(session.user.role as string)) {
    throw new AuthorizationError("Unauthorized scanner");
  }

  const validator = new HMACPassValidator();
  const passData = await validator.validate(signedPass);
  if (!passData.valid) {
    throw new ValidationError("Invalid or tampered pass");
  }

  const { eventId, userId, passCode } = passData;

  if (!eventId || !userId || !passCode) {
    throw new ValidationError("Invalid pass payload");
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) {
    throw new ValidationError("Event not found");
  }

  const isAdmin = ["admin", "owner"].includes(session.user.role as string);
  if (!isAdmin) {
    const userDomain = await getUserDomain(session.user.id, session.user.role as string);
    if (event.domain !== userDomain) {
      throw new AuthorizationError("You can only check-in users for events within your domain.");
    }
  }

  if (event.slug !== slug) {
    throw new ValidationError("Pass belongs to a different event");
  }

  const result = await db.transaction(async (tx) => {
    const regData = await tx.select().from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.userId, userId as string),
          eq(registrations.passCode, passCode as string)
        )
      ).limit(1);

    if (!regData.length) {
      return { error: "Registration not found or pass code mismatch", status: 404 };
    }

    const registration = regData[0];

    if (registration.status !== "confirmed") {
      return { error: `User is not confirmed (status: ${registration.status})`, status: 400 };
    }

    if (registration.checkedInAt) {
      return { error: "User is already checked in", status: 400 };
    }

    await tx.update(registrations)
      .set({ status: "checked_in", checkedInAt: new Date() })
      .where(eq(registrations.id, registration.id));

    const userData = await tx.select().from(user).where(eq(user.id, userId as string)).limit(1);

    return { success: true, user: userData[0] };
  });

  return result;
}

export async function getSessions(eventId: string) {
  const sessions = await db.select()
    .from(eventSessions)
    .where(eq(eventSessions.eventId, eventId))
    .orderBy(eventSessions.startTime);
    
  return sessions;
}

export async function createSession(sessionAuth: AuthSession, eventId: string, data: any) {
  const role = sessionAuth.user.role as string;
  const allowedRoles = ["admin", "owner", "lead", "event_lead", "co_lead"];
  
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to create event sessions.");
  }
  await checkEmergencyFreeze(role);

  const { title, description, startTime, endTime, location } = data;

  const [newSession] = await db.insert(eventSessions).values({
    id: crypto.randomUUID(),
    eventId,
    title,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    location,
    createdAt: new Date(),
  }).returning();

  return newSession;
}

export async function markAttendance(sessionAuth: AuthSession, eventId: string, sessionId: string, passCode: string) {
  const role = sessionAuth.user.role as string;
  const adminRoles = ["admin", "owner"];
  if (!adminRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to mark attendance.");
  }

  // Find registration
  const [registration] = await db.select()
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.passCode, passCode),
        eq(registrations.status, "confirmed")
      )
    );

  if (!registration) {
    throw new ValidationError("Invalid or inactive pass code");
  }

  // Check if already attended
  const [existing] = await db.select().from(sessionAttendance).where(
    and(
      eq(sessionAttendance.sessionId, sessionId),
      eq(sessionAttendance.userId, registration.userId!)
    )
  );

  if (existing) {
    throw new ValidationError("Already checked in");
  }

  // Mark attendance
  await db.insert(sessionAttendance).values({
    id: crypto.randomUUID(),
    sessionId,
    userId: registration.userId!,
    checkedInAt: new Date(),
  });

  return { success: true, message: "Checked in successfully" };
}

export async function getInviteLink(sessionAuth: AuthSession, eventId: string) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const userDomain = await getUserDomain(sessionAuth.user.id, role);
    if (event.domain !== userDomain) {
      throw new AuthorizationError("Forbidden: Event is outside your domain");
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://club.com";
  
  let inviteLink = "";
  if (event.capacity && event.capacity > 100) {
    const domain = baseUrl.replace("https://", "").replace("http://", "");
    inviteLink = `https://${event.slug}.${domain}`;
  } else {
    inviteLink = `${baseUrl}/events/${event.slug}`;
  }

  inviteLink += "?ref=invite";

  return { inviteLink };
}