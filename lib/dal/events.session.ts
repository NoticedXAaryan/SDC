import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { checkEmergencyFreeze, getUserDomain } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, eventSessions, notifications, registrations, sessionAttendance, user } from "@/lib/db/schema";
import { logAuditEvent } from "@/lib/services/audit";
import crypto from "crypto";
import { and, eq, ilike, or } from "drizzle-orm";

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