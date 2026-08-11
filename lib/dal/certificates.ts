import { db } from "@/lib/db";
import { certificatesV2, certTemplates, registrations, user, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { certificateQueue } from "@/lib/queues/certificates";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { getUserDomain } from "@/lib/dal/auth";

export async function generateCertificates(sessionAuth: AuthSession, eventId: string) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const templateData = await db.select().from(certTemplates).where(eq(certTemplates.eventId, eventId)).limit(1);
  const template = templateData[0];
  
  if (!template) {
      throw new ValidationError("No certificate template linked to this event.");
  }

  const confirmedRegistrations = await db.select().from(registrations).where(
      and(
          eq(registrations.eventId, eventId),
          eq(registrations.status, "confirmed")
      )
  );

  if (confirmedRegistrations.length === 0) {
      throw new ValidationError("No confirmed registrations found for this event.");
  }

  const jobs = confirmedRegistrations.map(reg => ({
      name: `generate-cert-${reg.userId}-${eventId}`,
      data: {
          userId: reg.userId,
          eventId,
          templateId: template.id,
          issuedBy: sessionAuth.user.id
      }
  }));

  await certificateQueue.addBulk(jobs);

  return { success: true, count: jobs.length };
}

export async function issueAllCertificates(sessionAuth: AuthSession, eventId: string) {
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

  if (!event.certificateTemplateId) {
    throw new ValidationError("No certificate template configured for this event");
  }

  const template = await db.query.certTemplates.findFirst({
    where: eq(certTemplates.id, event.certificateTemplateId)
  });

  if (!template) {
    throw new ValidationError("Template not found");
  }

  const existingCerts = await db.select({ userId: certificatesV2.userId }).from(certificatesV2).where(eq(certificatesV2.eventId, eventId));
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

  const eligibleAttendees = attendees.filter(a => !existingUserIds.has(a.userId));

  if (eligibleAttendees.length === 0) {
    return { success: true, count: 0, message: "No eligible checked-in attendees found to issue certificates to." };
  }

  const jobs = eligibleAttendees.map(reg => ({
    name: "generate-certificate",
    data: {
      userId: reg.userId,
      eventId,
      templateId: event.certificateTemplateId,
      issuedBy: sessionAuth.user.id,
      userName: reg.userName,
      userEmail: reg.userEmail,
    },
  }));

  await certificateQueue.addBulk(jobs);

  return { success: true, count: jobs.length };
}