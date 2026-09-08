import { db } from "@/lib/db";
import { communications, eventInvites, user, events, notifications } from "@/lib/db/schema";
import { eq, desc, inArray, or, ilike } from "drizzle-orm";
import crypto from "crypto";

import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { assertCanManageEvent } from "@/lib/dal/event-access";
import { createTransactionalEmailJob } from "@/lib/queues/email";
import { escapeHtml, toSafeHttpUrl } from "@/lib/email/html";

export async function getEventCommunications(sessionAuth: AuthSession, eventId: string) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner", "lead", "co_lead", "event_lead"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new ValidationError("Event not found");

  await assertCanManageEvent(sessionAuth, event);

  const comms = await db.select()
    .from(communications)
    .where(eq(communications.eventId, eventId))
    .orderBy(desc(communications.createdAt));

  return comms;
}

export async function createEventCommunicationDb(sessionAuth: AuthSession, eventId: string, data: { subject: string; body: string; targetAudience: "all" | "confirmed" | "waitlist" }) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner", "lead", "co_lead", "event_lead"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new ValidationError("Event not found");

  await assertCanManageEvent(sessionAuth, event);

  const { subject, body: messageBody, targetAudience } = data;

  if (!subject || !messageBody || !["all", "confirmed", "waitlist"].includes(targetAudience)) {
    throw new ValidationError("Invalid payload");
  }

  const commId = crypto.randomUUID();
  await db.insert(communications).values({
    id: commId,
    eventId,
    senderId: sessionAuth.user.id,
    subject,
    body: messageBody,
    targetAudience,
    status: "processing",
    sentCount: 0,
  });

  return { id: commId, subject, messageBody, targetAudience };
}

export async function markEventCommunicationQueueFailed(communicationId: string) {
  await db.update(communications)
    .set({ status: "failed" })
    .where(eq(communications.id, communicationId));
}

export async function sendInvitesDb(sessionAuth: AuthSession, eventId: string, emails: string[]) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const [event] = await db.select().from(events).where(eq(events.id, eventId));
  if (!event) throw new ValidationError("Event not found");

  const existingUsers = emails.length > 0
    ? await db.select({ id: user.id, email: user.email }).from(user).where(inArray(user.email, emails))
    : [];
  const userMap = new Map(existingUsers.map(u => [u.email, u.id]));

  const invitesToInsert = [];
  const jobsToQueue = [];

  for (const email of emails) {
    const token = crypto.randomUUID();
    const inviteId = crypto.randomUUID();
    
    invitesToInsert.push({
      id: inviteId,
      eventId,
      userId: userMap.get(email) || null,
      email,
      token,
      status: "pending" as const,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
    });

    const inviteUrl = toSafeHttpUrl(
      `/events/${encodeURIComponent(eventId)}/join?token=${encodeURIComponent(token)}`,
      process.env.BETTER_AUTH_URL || "http://localhost:3000",
    );
    if (!inviteUrl) throw new ValidationError("Application URL must use HTTP or HTTPS");
    const safeEventTitle = escapeHtml(event.title);
    jobsToQueue.push({
      name: "send-event-invite",
      data: createTransactionalEmailJob({
        to: email,
        subject: `You're invited to ${event.title}`,
        html: `<p>You have been invited to ${safeEventTitle}.</p><p><a href="${escapeHtml(inviteUrl)}">View invitation and RSVP</a></p>`,
      }),
      opts: { jobId: `invite-${inviteId}` }
    });
  }

  let insertedInvites = [];
  if (invitesToInsert.length > 0) {
    insertedInvites = await db.insert(eventInvites).values(invitesToInsert).returning();
  }

  return { success: true, count: insertedInvites.length, jobsToQueue };
}

export async function notifyColleagues(sessionAuth: AuthSession, eventId: string, data: { subject: string; message: string }) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "event_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const { subject, message } = data;

  if (!subject || !message) {
    throw new ValidationError("Subject and message are required");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  await assertCanManageEvent(sessionAuth, event);

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
    type: "colleague_update",
    title: subject,
    message: `${event.title} Update: ${message}`,
    link: `/events/${event.slug}/manage?tab=communications`,
  }));

  if (notifs.length > 0) {
    const chunkSize = 100;
    for (let i = 0; i < notifs.length; i += chunkSize) {
      await db.insert(notifications).values(notifs.slice(i, i + chunkSize));
    }
  }

  return { success: true, count: notifs.length };
}

export async function getWhatsappTemplate(sessionAuth: AuthSession, eventId: string) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "event_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  await assertCanManageEvent(sessionAuth, event);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://club.com";
  const eventUrl = `${baseUrl}/events/${event.slug}`;
  const dateStr = new Date(event.startsAt).toLocaleDateString();
  const timeStr = new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const whatsappMessage = `*📣 Upcoming Event: ${event.title}!*\n\n` +
    `📅 *Date:* ${dateStr}\n` +
    `⏰ *Time:* ${timeStr}\n` +
    (event.location ? `📍 *Location:* ${event.location}\n` : '') +
    `\n${event.description}\n\n` +
    `🔗 *Register here:* ${eventUrl}\n\n` +
    `_Don't miss out!_`;

  return { message: whatsappMessage };
}
