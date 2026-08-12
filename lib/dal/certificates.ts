import { db } from "@/lib/db";
import { certificates, certTemplates, registrations, user, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getEventWithTemplate(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event || !event.certificateTemplateId) {
    return { event: event ?? null, template: null };
  }

  const template = await db.query.certTemplates.findFirst({
    where: eq(certTemplates.id, event.certificateTemplateId)
  });

  return { event, template: template ?? null };
}

export async function getEligibleAttendeesForCertificates(eventId: string) {
  const existingCerts = await db.select({ userId: certificates.userId }).from(certificates).where(eq(certificates.eventId, eventId));
  const existingUserIds = new Set(existingCerts.map(c => c.userId));

  const attendees = await db
    .select({
      userId: registrations.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(registrations)
    .innerJoin(user, eq(registrations.userId, user.id))
    .where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.status, "checked_in")
      )
    );

  return attendees.filter(a => !existingUserIds.has(a.userId));
}