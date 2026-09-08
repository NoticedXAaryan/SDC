import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { checkEmergencyFreeze, getUserDomain } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, eventSessions, notifications, registrations, sessionAttendance, user } from "@/lib/db/schema";
import { logAuditEvent } from "@/lib/services/audit";
import crypto from "crypto";
import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { assertCanManageEvent } from "@/lib/dal/event-access";

export async function scheduleMeeting(sessionAuth: AuthSession, eventId: string, data: { title: string; description?: string; startTime: string; endTime: string; meetingLink: string }) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "event_lead", "admin", "owner"].includes(role)) {
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

  await assertCanManageEvent(sessionAuth, event);

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
    link: `/events/${event.slug}/manage?tab=sessions`,
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

export async function getSessions(sessionAuth: AuthSession, eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new ValidationError("Event not found");

  if (event.status !== "published") {
    const role = sessionAuth.user.role as string;
    const isAdmin = ["admin", "owner"].includes(role);
    const userDomain = isAdmin ? null : await getUserDomain(sessionAuth.user.id, role);
    if (!isAdmin && event.createdBy !== sessionAuth.user.id && event.domain !== userDomain) {
      throw new AuthorizationError("You cannot view sessions for this event");
    }
  }

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

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new ValidationError("Event not found");

  await assertCanManageEvent(sessionAuth, event);

  const sessionStart = new Date(startTime);
  const sessionEnd = new Date(endTime);
  if (sessionEnd <= sessionStart) throw new ValidationError("Session end time must be after its start time");
  if (sessionStart < new Date(event.startsAt) || (event.endsAt && sessionEnd > new Date(event.endsAt))) {
    throw new ValidationError("Session must be scheduled within the event timeframe");
  }

  const [newSession] = await db.insert(eventSessions).values({
    id: crypto.randomUUID(),
    eventId,
    title,
    description,
    startTime: sessionStart,
    endTime: sessionEnd,
    location,
    createdAt: new Date(),
  }).returning();

  return newSession;
}

export async function markAttendance(sessionAuth: AuthSession, eventId: string, sessionId: string, passCode: string) {
  const role = sessionAuth.user.role as string;
  const allowedRoles = ["admin", "owner", "lead", "event_lead", "co_lead", "faculty_coordinator", "volunteer_lead"];
  if (!allowedRoles.includes(role)) {
    throw new AuthorizationError("You do not have permission to mark attendance.");
  }

  const [eventSession] = await db.select().from(eventSessions).where(and(
    eq(eventSessions.id, sessionId),
    eq(eventSessions.eventId, eventId),
  )).limit(1);
  if (!eventSession) throw new ValidationError("Session does not belong to this event");

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new ValidationError("Event not found");
  if (!["admin", "owner", "faculty_coordinator", "event_lead", "volunteer_lead"].includes(role)) {
    await assertCanManageEvent(sessionAuth, event);
  }

  // Find registration
  const [registration] = await db.select()
    .from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.passCode, passCode),
        inArray(registrations.status, ["confirmed", "checked_in"])
      )
    );

  if (!registration) {
    throw new ValidationError("Invalid or inactive pass code");
  }

  const [attendance] = await db.insert(sessionAttendance).values({
    id: crypto.randomUUID(),
    sessionId,
    userId: registration.userId!,
    checkedInAt: new Date(),
  }).onConflictDoNothing().returning({ id: sessionAttendance.id });

  if (!attendance) {
    return { success: true, message: "Already checked in", alreadyCheckedIn: true };
  }

  if (registration.status === "confirmed") {
    await db.update(registrations).set({
      status: "checked_in",
      checkedInAt: new Date(),
      attendanceMethod: "qr",
    }).where(and(eq(registrations.id, registration.id), eq(registrations.status, "confirmed")));
  }

  return { success: true, message: "Checked in successfully", alreadyCheckedIn: false };
}
