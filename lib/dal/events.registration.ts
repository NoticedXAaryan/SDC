import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { checkEmergencyFreeze, getUserDomain } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { generateSignedPass, HMACPassValidator } from "@/lib/passes/qr";
import { emailQueue } from "@/lib/queues/email";
import { logAuditEvent } from "@/lib/services/audit";
import { NotificationService } from "@/lib/services/notifications";
import crypto from "crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import Papa from "papaparse";

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

    const emails = validRows.map(r => r.email!.trim().toLowerCase());
  if (emails.length === 0) return { imported: 0, total: 0, errors: [] };

  const existingUsers = await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, emails));
  const existingEmails = new Set(existingUsers.map(u => u.email));
  
  const usersToInsert = validRows
    .filter(r => !existingEmails.has(r.email!.trim().toLowerCase()))
    .map(r => ({
      id: nanoid(),
      name: r.name?.trim() || "Unknown",
      email: r.email!.trim().toLowerCase(),
      emailVerified: false,
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  if (usersToInsert.length > 0) {
    await db.insert(user).values(usersToInsert).onConflictDoNothing();
  }

  const allTargetUsers = await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, emails));
  const userIdMap = new Map(allTargetUsers.map(u => [u.email, u.id]));
  const userIds = Array.from(userIdMap.values());

  if (userIds.length === 0) return { imported: 0, total: validRows.length, errors: [{ rowNumber: 0, error: "Failed to map users" }] };

  const existingRegs = await db.select({ userId: registrations.userId }).from(registrations).where(
    and(
      eq(registrations.eventId, eventId),
      inArray(registrations.userId, userIds)
    )
  );
  const existingRegUserIds = new Set(existingRegs.map(r => r.userId));

  const regsToInsert = validRows
    .map(r => {
      const email = r.email!.trim().toLowerCase();
      const userId = userIdMap.get(email);
      if (!userId || existingRegUserIds.has(userId)) return null;
      
      const rawStatus = r.status?.trim().toLowerCase();
      const status = (["confirmed", "waitlist", "checked_in", "cancelled", "no_show"].includes(rawStatus || "") ? rawStatus : "confirmed") as "confirmed" | "waitlist" | "checked_in" | "cancelled" | "no_show";
      return {
        id: nanoid(),
        eventId,
        userId,
        passCode: nanoid(10),
        status,
        createdAt: new Date(),
      };
    })
    .filter(Boolean) as any[];

  if (regsToInsert.length > 0) {
    await db.insert(registrations).values(regsToInsert).onConflictDoNothing();
  }

  return { imported: regsToInsert.length, total: validRows.length, errors: [] };
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