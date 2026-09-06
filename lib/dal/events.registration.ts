import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { checkEmergencyFreeze, getUserDomain } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, events, registrations, user } from "@/lib/db/schema";
import { generateSignedPass, HMACPassValidator } from "@/lib/passes/qr";
import { getEmailQueue } from "@/lib/queues/email";
import { logAuditEvent } from "@/lib/services/audit";
import { NotificationService } from "@/lib/services/notifications";
import crypto from "crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import Papa from "papaparse";
import { validateEventRegistrationResponses } from "@/lib/validators/event";
import { makeAuditRecord } from "@/lib/services/audit";
import { assertCanManageEvent } from "@/lib/dal/event-access";
import { z } from "zod";

const attendeeImportRowSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().toLowerCase().email().max(254),
  status: z.preprocess(
    (value) => value === "" || value == null ? undefined : String(value).trim().toLowerCase(),
    z.enum(["confirmed", "waitlist"]).optional(),
  ),
});

export async function exportEventAttendees(sessionAuth: AuthSession, eventId: string) {
  const role = sessionAuth.user.role as string;
  if (!["co_lead", "event_lead", "lead", "faculty_coordinator", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  await assertCanManageEvent(sessionAuth, event);

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

  const csvContent = Papa.unparse(attendees, { escapeFormulae: true });
  return { csvContent, eventSlug: event.slug };
}

export async function importEventAttendees(sessionAuth: AuthSession, eventId: string, csvText: string) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner", "lead", "event_lead", "co_lead"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }
  await checkEmergencyFreeze(role);

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) throw new ValidationError("Event not found");
  await assertCanManageEvent(sessionAuth, event);

  const parsed = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    throw new ValidationError("Failed to parse CSV");
  }

  if (parsed.data.length > 1000) {
    throw new ValidationError("A single attendee import can contain at most 1000 rows");
  }
  const rowResults = parsed.data.map((row, index) => ({ row: index + 2, parsed: attendeeImportRowSchema.safeParse(row) }));
  const invalidRows = rowResults.filter((entry) => !entry.parsed.success).map((entry) => entry.row);
  if (invalidRows.length > 0) {
    throw new ValidationError(`Invalid attendee data on CSV row${invalidRows.length === 1 ? "" : "s"}: ${invalidRows.slice(0, 20).join(", ")}`);
  }
  const deduplicatedRows = Array.from(new Map(
    rowResults.map((entry) => [entry.parsed.data!.email, entry.parsed.data!]),
  ).values());

  if (deduplicatedRows.length === 0) {
    throw new ValidationError("No valid rows with 'email' column found");
  }
  const emails = deduplicatedRows.map((row) => row.email);

  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM ${events} WHERE id = ${eventId} FOR UPDATE`);
    const existingUsers = await tx.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, emails));
    const existingEmails = new Set(existingUsers.map((entry) => entry.email));
    const usersToInsert = deduplicatedRows.filter((row) => !existingEmails.has(row.email)).map((row) => ({
      id: nanoid(),
      name: row.name || "Guest attendee",
      email: row.email,
      emailVerified: false,
      role: "outsider",
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    if (usersToInsert.length > 0) {
      await tx.insert(user).values(usersToInsert).onConflictDoNothing({ target: user.email });
    }

    const allTargetUsers = await tx.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, emails));
    const userIdMap = new Map(allTargetUsers.map((entry) => [entry.email, entry.id]));
    const userIds = Array.from(userIdMap.values());
    const existingRegs = userIds.length > 0
      ? await tx.select({ userId: registrations.userId }).from(registrations).where(and(
          eq(registrations.eventId, eventId),
          inArray(registrations.userId, userIds),
        ))
      : [];
    const existingRegUserIds = new Set(existingRegs.map((registration) => registration.userId));
    const [confirmedResult] = await tx.select({ count: sql<number>`count(*)` }).from(registrations)
      .where(and(eq(registrations.eventId, eventId), inArray(registrations.status, ["confirmed", "checked_in"])));
    let remainingSeats = event.capacity
      ? Math.max(0, event.capacity - Number(confirmedResult.count))
      : Number.POSITIVE_INFINITY;

    const registrationsToInsert: Array<typeof registrations.$inferInsert> = [];
    for (const row of deduplicatedRows) {
      const userId = userIdMap.get(row.email);
      if (!userId || existingRegUserIds.has(userId)) continue;
      const requestedStatus = row.status || "confirmed";
      const status = requestedStatus === "confirmed" && remainingSeats <= 0 ? "waitlist" : requestedStatus;
      if (status === "confirmed") remainingSeats -= 1;
      registrationsToInsert.push({
        id: nanoid(),
        eventId,
        userId,
        passCode: nanoid(16),
        status,
        createdAt: new Date(),
      });
    }
    if (registrationsToInsert.length > 0) {
      await tx.insert(registrations).values(registrationsToInsert).onConflictDoNothing();
    }
    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: sessionAuth.user.id,
      action: "data_import",
      entity: "event",
      entityId: eventId,
      details: JSON.stringify({ requested: deduplicatedRows.length, imported: registrationsToInsert.length }),
    }));
    return { imported: registrationsToInsert.length, total: deduplicatedRows.length, errors: [] };
  });
}

export async function registerForEvent(session: AuthSession, eventId: string, formResponses: any = null) {
  if (!session.user.emailVerified) throw new AuthorizationError("Verify your email before registering");
  await checkEmergencyFreeze(session.user.role);
  const result = await db.transaction(async (tx) => {
    const { rows } = await tx.execute(
      sql`SELECT * FROM ${events} WHERE id = ${eventId} FOR UPDATE`
    );
    const event = rows[0] as any;

    if (!event || event.deletedAt) return { error: "Event not found", status: 404 };
    if (event.status !== "published") return { error: "Event is not open for registration", status: 400 };
    if (new Date() >= new Date(event.startsAt)) return { error: "This event has already started", status: 400 };
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return { error: "Registration deadline has passed", status: 400 };
    }
    if (event.isPaid) {
      return {
        error: "Paid registration is unavailable until a payment is verified. No registration has been created.",
        status: 409,
      };
    }
    if (["private", "invite_only"].includes(event.visibility)) {
      return { error: "This event requires an invitation", status: 403 };
    }
    if ((event.isInternal || event.visibility === "members_only") && ["user", "outsider", "applicant"].includes(session.user.role || "user")) {
      return { error: "This event is only available to club members", status: 403 };
    }

    let validatedResponses: Record<string, string>;
    try {
      validatedResponses = validateEventRegistrationResponses(event.forms, formResponses);
    } catch {
      return { error: "Registration form responses are invalid or incomplete", status: 400 };
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
      .where(and(eq(registrations.eventId, eventId), inArray(registrations.status, ["confirmed", "checked_in"])));

    const confirmedCount = Number(countResult.count);
    const hasCapacity = !event.capacity || confirmedCount < event.capacity;

    const regStatus = hasCapacity ? "confirmed" : "waitlist";
    const passCode = crypto.randomBytes(8).toString("hex");
    const regId = existingReg?.id || crypto.randomUUID();

    if (existingReg) {
      await tx.update(registrations)
        .set({ status: regStatus, passCode, formResponses: validatedResponses, createdAt: new Date(), checkedInAt: null, attendanceMethod: null })
        .where(eq(registrations.id, regId));
    } else {
      await tx.insert(registrations).values({
        id: regId,
        eventId,
        userId: session.user.id,
        status: regStatus,
        passCode,
        formResponses: validatedResponses,
      });
    }

    const [waitlistCount] = regStatus === "waitlist"
      ? await tx.select({ count: sql<number>`count(*)` })
        .from(registrations)
        .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "waitlist")))
      : [{ count: 0 }];

    return { success: true, event, regId, regStatus, passCode, waitlistPosition: Number(waitlistCount.count) };
  });

  if (result.error) return result;

  const { event, regId, regStatus, passCode, waitlistPosition } = result;
  let passToken: string | null = null;
  if (regStatus === "confirmed") {
    passToken = generateSignedPass({
      eventId,
      userId: session.user.id,
      passCode: passCode as string,
    }, event.endsAt);
  }

  await logAuditEvent({
    actorId: session.user.id,
    action: "registration_create",
    entity: "registration",
    entityId: regId as string,
    details: `Registered for event "${event.title}" with status: ${regStatus}`,
  });

  if (regStatus === "confirmed" && passToken) {
    void getEmailQueue().add("send-qr-pass", {
      type: "event_registration",
      payload: {
        email: session.user.email,
        eventTitle: event.title,
        qrCodeDataUrl: passToken,
      }
    }, { jobId: crypto.createHash("sha256").update(`event_registration:${regId}`).digest("hex") })
      .catch((error) => console.error("Failed to enqueue event pass email", error));
  }

  void NotificationService.sendInAppNotification({
    userId: session.user.id,
    type: "event",
    title: regStatus === "confirmed" ? "Registration Confirmed" : "Added to Waitlist",
    message: regStatus === "confirmed"
      ? `You're registered for "${event.title}". Your QR pass is ready.`
      : `You've been added to the waitlist for "${event.title}".`,
    link: `/events/${event.slug}`,
  }).catch((error) => console.error("Failed to create registration notification", error));

  return {
    success: true,
    registrationId: regId,
    status: regStatus,
    passToken,
    message: regStatus === "confirmed"
      ? "Registration confirmed! Your QR pass is ready."
      : `You're on the waitlist (position ${waitlistPosition}).`,
  };
}

export async function deregisterEvent(session: AuthSession, eventId: string) {
  await checkEmergencyFreeze(session.user.role);
  const result = await db.transaction(async (tx) => {
    // Registration and cancellation take the same event lock, so a newly freed
    // seat goes to the first waiting person before another signup can take it.
    await tx.execute(sql`SELECT id FROM ${events} WHERE id = ${eventId} FOR UPDATE`);
    const event = await tx.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event || event.deletedAt) throw new ValidationError("Event not found");

    const registration = await tx.query.registrations.findFirst({
      where: and(eq(registrations.eventId, eventId), eq(registrations.userId, session.user.id)),
    });
    if (!registration) throw new ValidationError("Registration not found");
    if (registration.status === "cancelled") return { event, alreadyCancelled: true, promoted: null };
    if (registration.status === "checked_in" || registration.checkedInAt) {
      throw new ValidationError("You have already checked in and cannot cancel this registration");
    }
    if (new Date() >= new Date(event.startsAt)) throw new ValidationError("Cannot deregister after event has started");

    await tx.update(registrations).set({ status: "cancelled" }).where(eq(registrations.id, registration.id));
    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: session.user.id, action: "event_deregister", entity: "registration",
      entityId: registration.id, details: `User cancelled registration for ${event.title}`,
    }));

    let promoted: typeof registrations.$inferSelect | null = null;
    if (registration.status === "confirmed" && event.status === "published" && event.capacity) {
      const [occupied] = await tx.select({ count: sql<number>`count(*)` }).from(registrations)
        .where(and(eq(registrations.eventId, eventId), inArray(registrations.status, ["confirmed", "checked_in"])));
      if (Number(occupied.count) < event.capacity) {
        const next = await tx.query.registrations.findFirst({
          where: and(eq(registrations.eventId, eventId), eq(registrations.status, "waitlist")),
          orderBy: [asc(registrations.createdAt), asc(registrations.id)],
        });
        if (next) {
          [promoted] = await tx.update(registrations)
            .set({ status: "confirmed", passCode: crypto.randomBytes(8).toString("hex") })
            .where(eq(registrations.id, next.id)).returning();
          await tx.insert(auditLogs).values(makeAuditRecord({
            actorId: session.user.id, action: "waitlist_promotion", entity: "registration",
            entityId: next.id, details: `Cancellation automatically promoted the next waiting attendee for ${event.title}`,
          }));
        }
      }
    }
    return { event, alreadyCancelled: false, promoted };
  });

  if (!result.alreadyCancelled) {
    const { event, promoted } = result;
    await NotificationService.sendInAppNotification({
      userId: session.user.id, type: "event", title: "Registration cancelled",
      message: `Your registration for "${event.title}" has been cancelled.`, link: `/events/${event.slug}`,
    }).catch((error) => console.error("Failed to create cancellation notification", error));
    if (promoted) {
      await NotificationService.sendInAppNotification({
        userId: promoted.userId, type: "event", title: "Your place is confirmed",
        message: `A place opened up at "${event.title}". Your pass is ready.`, link: `/passes/${eventId}`,
      }).catch((error) => console.error("Failed to create waitlist promotion notification", error));
      const attendee = await db.query.user.findFirst({ where: eq(user.id, promoted.userId) });
      if (attendee && promoted.passCode) {
        const passToken = generateSignedPass({ eventId, userId: attendee.id, passCode: promoted.passCode }, event.endsAt);
        await getEmailQueue().add("send-qr-pass", {
          type: "event_registration",
          payload: { email: attendee.email, eventTitle: event.title, qrCodeDataUrl: passToken },
        }, { jobId: crypto.createHash("sha256").update(`event_promotion:${promoted.id}:${promoted.passCode}`).digest("hex") })
          .catch((error) => console.error("Failed to enqueue promoted attendee pass", error));
      }
    }
  }
  return { success: true, message: result.alreadyCancelled ? "Registration already cancelled" : "Registration cancelled" };
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
  const result = await db.transaction(async (tx) => {
    const { rows } = await tx.execute(
      sql`SELECT * FROM ${events} WHERE id = ${eventId} FOR UPDATE`,
    );
    const event = rows[0] as typeof events.$inferSelect | undefined;

    if (!event) throw new ValidationError("Event not found");
    if (event.status !== "published") throw new ValidationError("Event is not open for registration");
    if (new Date() >= new Date(event.startsAt)) throw new ValidationError("This event has already started");
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      throw new ValidationError("Registration deadline has passed");
    }
    if (event.isPaid) {
      throw new ValidationError("Paid registration requires verified payment and is not available through guest registration");
    }
    if (!["public", "unlisted"].includes(event.visibility || "private")) {
      throw new AuthorizationError("This event is not open to guest registration");
    }

    let guestUser = await tx.query.user.findFirst({ where: eq(user.email, email) });
    if (!guestUser) {
      const [created] = await tx.insert(user).values({
        id: crypto.randomUUID(),
        name,
        email,
        emailVerified: false,
        role: "outsider",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoNothing({ target: user.email }).returning();
      guestUser = created || await tx.query.user.findFirst({ where: eq(user.email, email) });
    }
    if (!guestUser) throw new ValidationError("Guest account could not be created");

    const [existingReg] = await tx.select().from(registrations).where(and(
      eq(registrations.eventId, eventId),
      eq(registrations.userId, guestUser.id),
    )).limit(1);
    if (existingReg && existingReg.status !== "cancelled") {
      throw new ValidationError("Already registered for this event");
    }

    const [countResult] = await tx.select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(and(eq(registrations.eventId, eventId), inArray(registrations.status, ["confirmed", "checked_in"])));
    const registrationStatus = !event.capacity || Number(countResult.count) < event.capacity
      ? "confirmed" as const
      : "waitlist" as const;
    const passCode = crypto.randomBytes(8).toString("hex");
    const regId = existingReg?.id || crypto.randomUUID();

    if (existingReg) {
      await tx.update(registrations).set({ status: registrationStatus, passCode }).where(eq(registrations.id, regId));
    } else {
      await tx.insert(registrations).values({
        id: regId,
        eventId,
        userId: guestUser.id,
        status: registrationStatus,
        passCode,
      });
    }

    const [waitlistCount] = registrationStatus === "waitlist"
      ? await tx.select({ count: sql<number>`count(*)` }).from(registrations)
        .where(and(eq(registrations.eventId, eventId), eq(registrations.status, "waitlist")))
      : [{ count: 0 }];
    await tx.insert(auditLogs).values(makeAuditRecord({
      actorId: guestUser.id,
      action: "guest_register",
      entity: "registration",
      entityId: regId,
      details: JSON.stringify({ eventId, status: registrationStatus }),
    }));

    return {
      event,
      userId: guestUser.id,
      passCode,
      regId,
      status: registrationStatus,
      waitlistPosition: Number(waitlistCount.count),
    };
  });

  return {
    passCode: result.status === "confirmed" ? result.passCode : null,
    passToken: result.status === "confirmed"
      ? generateSignedPass({ eventId, userId: result.userId, passCode: result.passCode })
      : null,
    regId: result.regId,
    status: result.status,
    waitlistPosition: result.waitlistPosition,
  };
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
