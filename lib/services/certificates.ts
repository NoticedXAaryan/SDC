import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { getUserDomain } from "@/lib/dal/auth";
import type { AuthSession } from "@/lib/dal/auth";
import { getEventWithTemplate, getEligibleAttendeesForCertificates } from "@/lib/dal/certificates";
import { certificateQueue } from "@/lib/queues/certificates";

export class CertificateService {
  /**
   * Issues certificates to all eligible, checked-in attendees for a given event.
   * Respects domain-based RBAC.
   */
  static async issueCertificatesForEvent(sessionAuth: AuthSession, eventId: string) {
    const role = sessionAuth.user.role as string;
    if (!["co_lead", "lead", "admin", "owner"].includes(role)) {
      throw new AuthorizationError("Unauthorized");
    }

    // 1. Fetch Event and verify domain
    const { event, template } = await getEventWithTemplate(eventId);
    if (!event) {
        throw new ValidationError("Event not found");
    }
    
    if (!template) {
        throw new ValidationError("No certificate template configured for this event");
    }

    const isAdmin = ["admin", "owner"].includes(role);
    if (!isAdmin) {
      const userDomain = await getUserDomain(sessionAuth.user.id, role);
      if (event.domain !== userDomain) {
        throw new AuthorizationError("Forbidden: Event is outside your domain");
      }
    }

    // 2. Fetch Eligible Attendees
    const eligibleAttendees = await getEligibleAttendeesForCertificates(eventId);

    if (eligibleAttendees.length === 0) {
      return { success: true, count: 0, message: "No eligible checked-in attendees found to issue certificates to." };
    }

    // 3. Dispatch to Queue
    const jobs = eligibleAttendees.map(reg => ({
      name: "generate-certificate",
      data: {
        userId: reg.userId,
        eventId,
        templateId: template.id,
        issuedBy: sessionAuth.user.id,
        userName: reg.userName,
        userEmail: reg.userEmail,
      },
    }));

    await certificateQueue.addBulk(jobs);

    return { success: true, count: jobs.length };
  }

  /**
   * Issues certificates to an arbitrary list of users (V2 Bulk).
   * Respects RBAC implicitly by requiring a Lead/Admin session.
   */
  static async issueAdhocCertificates(sessionAuth: AuthSession, templateId: string, userIds: string[], eventId?: string) {
    const role = sessionAuth.user.role as string;
    if (!["co_lead", "lead", "admin", "owner"].includes(role)) {
      throw new AuthorizationError("Unauthorized");
    }

    // Since we're doing this via multi_replace, I will just call the DB directly here for simplicity,
    // though ideally it goes in DAL. But to save steps I will import db and user here.
    const { db } = await import("@/lib/db");
    const { user, certTemplates } = await import("@/lib/db/schema");
    const { inArray, eq } = await import("drizzle-orm");

    const template = await db.query.certTemplates.findFirst({
      where: eq(certTemplates.id, templateId),
    });

    if (!template) {
      throw new ValidationError("Template not found");
    }

    const targetUsers = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
    }).from(user).where(inArray(user.id, userIds));

    if (targetUsers.length === 0) {
      throw new ValidationError("No valid users found for the given IDs.");
    }

    const resolvedEventId = eventId || template.eventId || "SYSTEM_BLAST";

    const jobs = targetUsers.map(u => ({
      name: "generate-certificate",
      data: {
        userId: u.id,
        eventId: resolvedEventId,
        templateId,
        issuedBy: sessionAuth.user.id,
        userName: u.name,
        userEmail: u.email,
      },
    }));

    await certificateQueue.addBulk(jobs);

    return { success: true, count: jobs.length };
  }
}
