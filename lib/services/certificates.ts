/**
 * CertificateService — SOC-compliant event→attendance→certificate workflow.
 *
 * Both issuance commands:
 *   1. Check RBAC at service layer
 *   2. Validate domain ownership for non-admins  
 *   3. Use deterministic jobIds for idempotent queue delivery
 *   4. Write audit log before dispatching jobs
 *
 * The certificate worker (lib/workers/certificates.ts) is idempotent:
 * it checks for an existing certificate by (userId, eventId, templateId)
 * before inserting, so re-delivery is safe.
 */
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { getUserDomain, ADMIN_ROLES } from "@/lib/dal/auth";
import type { AuthSession } from "@/lib/dal/auth";
import type { SDCRole } from "@/lib/dal/auth";
import { getEventWithTemplate, getEligibleAttendeesForCertificates } from "@/lib/dal/certificates";
import { getCertificateQueue } from "@/lib/queues/certificates";
import { logAuditEvent } from "@/lib/services/audit";
import { db } from "@/lib/db";
import { user, certTemplates, certificates, auditLogs } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";
import {
  issueCertificatesSchema,
  issueAdhocCertificatesSchema,
  revokeCertificateSchema,
} from "@/lib/validators/certificate";
import crypto from "crypto";

// ─── RBAC Constants ────────────────────────────────────────────────────────

const CERTIFICATE_ISSUER_ROLES: SDCRole[] = ["co_lead", "lead", "vice_lead", "admin", "owner"];

// ─── Issue to All Eligible Event Attendees ─────────────────────────────────

/**
 * Issues certificates to all eligible (checked-in, not already issued) attendees.
 * Idempotent: the worker skips recipients who already have a certificate for this
 * (userId, eventId, templateId) combination.
 */
export class CertificateService {
  static async issueCertificatesForEvent(
    session: AuthSession,
    eventId: string
  ): Promise<{ success: true; count: number; message?: string }> {
    issueCertificatesSchema.parse({ eventId });
    const role = session.user.role as SDCRole;

    if (!CERTIFICATE_ISSUER_ROLES.includes(role)) {
      throw new AuthorizationError("Unauthorized to issue certificates.");
    }

    // Fetch event + template
    const { event, template } = await getEventWithTemplate(eventId);
    if (!event) throw new ValidationError("Event not found.");
    if (!template) throw new ValidationError("No certificate template configured for this event.");

    // Domain check for non-admins
    if (!ADMIN_ROLES.includes(role)) {
      const userDomain = await getUserDomain(session.user.id, role);
      if (event.domain && event.domain !== userDomain) {
        throw new AuthorizationError("Event is outside your domain.");
      }
    }

    // Get eligible attendees (checked-in, no existing certificate)
    const eligibleAttendees = await getEligibleAttendeesForCertificates(eventId);
    if (eligibleAttendees.length === 0) {
      return {
        success: true,
        count: 0,
        message: "No eligible checked-in attendees without existing certificates.",
      };
    }

    // Audit before dispatch (so we have a record even if queue fails)
    await logAuditEvent({
      actorId: session.user.id,
      action: "certificate_blast",
      entity: "certificate",
      entityId: eventId,
      details: JSON.stringify({
        recipientCount: eligibleAttendees.length,
        templateId: template.id,
      }),
    });

    // Dispatch idempotent jobs (jobId = hash of userId+eventId+templateId)
    const jobs = eligibleAttendees.map((reg) => ({
      name: "generate-certificate",
      data: {
        userId: reg.userId,
        eventId,
        templateId: template.id,
        issuedBy: session.user.id,
        userName: reg.userName,
        userEmail: reg.userEmail,
      },
      opts: {
        jobId: crypto.createHash("sha256")
          .update(`cert:${reg.userId}:${eventId}:${template.id}`)
          .digest("hex"),
        attempts: 3,
        backoff: { type: "exponential" as const, delay: 5000 },
      },
    }));

    await getCertificateQueue().addBulk(jobs);

    return { success: true, count: jobs.length };
  }

  // ─── Ad-hoc (bulk) certificate issuance ─────────────────────────────────

  /**
   * Issues certificates to an arbitrary list of users.
   * Idempotent: deterministic jobId prevents duplicate generation on retry.
   */
  static async issueAdhocCertificates(
    session: AuthSession,
    templateId: string,
    userIds: string[],
    eventId?: string | null,
    idempotencyKey?: string
  ): Promise<{ success: true; count: number }> {
    issueAdhocCertificatesSchema.parse({ templateId, userIds, eventId, idempotencyKey });
    const role = session.user.role as SDCRole;

    if (!CERTIFICATE_ISSUER_ROLES.includes(role)) {
      throw new AuthorizationError("Unauthorized to issue certificates.");
    }

    const template = await db.query.certTemplates.findFirst({
      where: eq(certTemplates.id, templateId),
    });
    if (!template) throw new ValidationError("Certificate template not found.");

    const targetUsers = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(inArray(user.id, userIds));

    if (targetUsers.length === 0) {
      throw new ValidationError("No valid users found for the given IDs.");
    }

    const resolvedEventId = eventId || template.eventId || "SYSTEM_BLAST";
    const batchKey = idempotencyKey ||
      crypto.createHash("sha256").update(`adhoc:${templateId}:${userIds.sort().join(",")}`).digest("hex");

    await logAuditEvent({
      actorId: session.user.id,
      action: "certificate_blast",
      entity: "certificate",
      entityId: templateId,
      details: JSON.stringify({
        recipientCount: targetUsers.length,
        eventId: resolvedEventId,
        batchKey,
      }),
    });

    const jobs = targetUsers.map((u) => ({
      name: "generate-certificate",
      data: {
        userId: u.id,
        eventId: resolvedEventId,
        templateId,
        issuedBy: session.user.id,
        userName: u.name,
        userEmail: u.email,
      },
      opts: {
        jobId: crypto.createHash("sha256")
          .update(`cert:${u.id}:${resolvedEventId}:${templateId}`)
          .digest("hex"),
        attempts: 3,
        backoff: { type: "exponential" as const, delay: 5000 },
      },
    }));

    await getCertificateQueue().addBulk(jobs);

    return { success: true, count: jobs.length };
  }

  // ─── Revoke Certificate ──────────────────────────────────────────────────

  /**
   * Revokes a certificate. Sets status to "revoked" with a reason.
   * Transactional: update + audit log in one operation.
   */
  static async revokeCertificate(
    session: AuthSession,
    rawData: unknown
  ): Promise<{ success: true }> {
    const data = revokeCertificateSchema.parse(rawData);
    const role = session.user.role as SDCRole;

    if (!ADMIN_ROLES.includes(role)) {
      throw new AuthorizationError("Only admins and owners may revoke certificates.");
    }

    const cert = await db.query.certificates.findFirst({
      where: eq(certificates.id, data.certificateId),
    });
    if (!cert) throw new ValidationError("Certificate not found.");
    if (cert.status === "revoked") {
      throw new ValidationError("Certificate is already revoked.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(certificates)
        .set({ status: "revoked", revokedReason: data.reason })
        .where(eq(certificates.id, data.certificateId));

      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(),
        actorId: session.user.id,
        action: "certificate_revoke",
        entity: "certificate",
        entityId: data.certificateId,
        details: JSON.stringify({ reason: data.reason, userId: cert.userId }),
        timestamp: new Date(),
      });
    });

    return { success: true };
  }
}
