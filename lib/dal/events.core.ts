import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { canTransition, checkEmergencyFreeze, getUserDomain, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { getAiQueue } from "@/lib/queues/ai";
import { logAuditEvent } from "@/lib/services/audit";
import { createDefaultEventTasks } from "@/lib/services/tasks";
import crypto from "crypto";
import { and, desc, eq, gte, ilike, isNull, sql } from "drizzle-orm";
import { getRedisClient } from "@/lib/redis";
import { assertEventConfiguration, canTransitionEventStatus, PAID_EVENTS_UNAVAILABLE_MESSAGE, type EventStatus } from "@/lib/domain/event";
import { assertCanManageEvent } from "@/lib/dal/event-access";
import { escapeHtml, toSafeHttpUrl } from "@/lib/email/html";

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

  const conditions = [isNull(events.deletedAt)];

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

  const redis = getRedisClient();
  const cacheKey = `events:count:${JSON.stringify(filters)}:${userDomain || ""}:${isManagement}`;
  let totalCount = 0;
  
  try {
    const cached = await redis.get(cacheKey);
    if (cached) totalCount = parseInt(cached, 10);
  } catch (e) {
    // Ignore redis errors
  }

  if (!totalCount) {
    const [countResult] = await countQuery;
    totalCount = Number(countResult.count);
    try {
      await redis.setex(cacheKey, 60, totalCount.toString());
    } catch (e) {
      // Ignore redis errors
    }
  }

  return {
    events: allEvents,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export async function createEvent(session: AuthSession, data: any) {
  const role = session.user.role as string;
  const allowedRoles = ["lead", "co_lead", "event_lead", "admin", "owner"];
  
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

  if (data.isPaid && !isDraft) {
    throw new ValidationError(PAID_EVENTS_UNAVAILABLE_MESSAGE);
  }

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
    forms: data.forms || [],
    certificateTemplateId: data.certificateTemplateId || null,
    createdBy: session.user.id,
  });

  // Trigger default tasks generation
  await createDefaultEventTasks({
    eventId,
    eventSlug: slug,
    type: data.type || "workshop",
    isInternal: data.isInternal || false,
    startsAt: new Date(data.startsAt),
    endsAt: new Date(data.endsAt),
  });

  await logAuditEvent({
    actorId: session.user.id,
    action: "event_create",
    entity: "event",
    entityId: eventId,
    details: `Created event: ${data.title}`,
  });

  try {
    // Enqueue AI job to draft comms (WhatsApp & Email)
    await getAiQueue().add("draft_event_comms", {
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

  await assertCanManageEvent(session, event);

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin && data.domain !== undefined && data.domain !== event.domain) {
    throw new AuthorizationError("Only administrators can move an event to another domain");
  }

  const updateData: Record<string, any> = {};

  const effectiveConfiguration = {
    startsAt: data.startsAt ?? event.startsAt,
    endsAt: data.endsAt ?? event.endsAt,
    registrationDeadline: data.registrationDeadline ?? event.registrationDeadline,
    isPaid: data.isPaid ?? event.isPaid,
    price: data.isPaid === false ? 0 : (data.price ?? event.price),
  };

  try {
    assertEventConfiguration(effectiveConfiguration);
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : "Invalid event configuration");
  }
  if (effectiveConfiguration.isPaid && (event.status === "published" || data.status === "published")) {
    throw new ValidationError(PAID_EVENTS_UNAVAILABLE_MESSAGE);
  }
  
  if (data.title !== undefined) updateData.title = data.title;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.domain !== undefined) updateData.domain = data.domain;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.capacity !== undefined) updateData.capacity = data.capacity;
  if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
  if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
  if (data.registrationDeadline !== undefined) updateData.registrationDeadline = new Date(data.registrationDeadline);
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
  if (data.price !== undefined || data.isPaid === false) updateData.price = String(effectiveConfiguration.price);
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
  if (data.forms !== undefined) updateData.forms = data.forms;
  if (data.certificateTemplateId !== undefined) updateData.certificateTemplateId = data.certificateTemplateId;
  
  if (data.status !== undefined) {
    const fromStatus = (event.status || "draft") as EventStatus;
    if (!canTransition(role as any, "event", fromStatus, data.status) || !canTransitionEventStatus(fromStatus, data.status)) {
      throw new AuthorizationError(`Event cannot transition from ${fromStatus} to ${data.status}`);
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
      const safeEventTitle = escapeHtml(updateData.title || event.title);
      const eventUrl = toSafeHttpUrl(
        `/events/${encodeURIComponent(event.slug)}`,
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      );
      if (!eventUrl) throw new ValidationError("Application URL must use HTTP or HTTPS");
      const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Event Update: ${safeEventTitle}</h2>
              <p>This is to notify you that there have been updates to an event you registered for.</p>
              <p>Please check the latest details on the event page.</p>
              <a href="${escapeHtml(eventUrl)}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Event Details</a>
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
  
  await checkEmergencyFreeze(role);

  const [event] = await db.select().from(events).where(and(eq(events.id, id), isNull(events.deletedAt))).limit(1);
  if (!event) throw new ValidationError("Event not found");
  if (event.status === "published") return { success: true, alreadyApproved: true };
  if (event.status !== "draft") {
    throw new ValidationError(`Only draft events can be approved (current status: ${event.status})`);
  }

  try {
    assertEventConfiguration(event);
  } catch (error) {
    throw new ValidationError(error instanceof Error ? error.message : "Event is not ready for approval");
  }
  if (event.isPaid) throw new ValidationError(PAID_EVENTS_UNAVAILABLE_MESSAGE);

  const [updated] = await db.update(events)
    .set({ status: "published", updatedAt: new Date() })
    .where(and(eq(events.id, id), eq(events.status, "draft")))
    .returning({ id: events.id });
  if (!updated) return { success: true, alreadyApproved: true };
  
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
