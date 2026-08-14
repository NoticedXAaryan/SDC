/**
 * Certificate Worker — Idempotent certificate generation.
 *
 * Safe under:
 *   - Duplicate job delivery (checks for existing certificate before inserting)
 *   - Worker restart (jobs are persistent in Redis/BullMQ)
 *   - Failed PDF rendering (job fails cleanly, retries with exponential backoff)
 *   - Missing provider (email) — certificate is still saved, email failure is logged
 *
 * Idempotency key: (userId, eventId, templateId) combination.
 * If a certificate already exists for this combination, the worker exits
 * successfully without creating a duplicate.
 */
import { Worker, Job } from "bullmq";
import { db } from "@/lib/db";
import { certificates, certTemplates, user, events, auditLogs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { PdfmeRenderer } from "@/lib/services/PdfmeRenderer";
import { LocalMockStorageService } from "@/lib/services/storage";
import { Mailer } from "@/lib/services/mailer";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { getWorkerConfig } from "@/lib/redis";

export const certificateWorker = new Worker(
  "certificate-generation",
  async (job: Job) => {
    const { userId, eventId, templateId, issuedBy, userName, userEmail } = job.data;

    logger.info(
      { jobId: job.id, userId, eventId, templateId },
      "Processing certificate job"
    );

    // ── Idempotency Guard ────────────────────────────────────────────────
    // If a non-revoked certificate already exists for this combination, skip.
    const resolvedEventId =
      eventId === "SYSTEM_ISSUE" || eventId === "SYSTEM_BLAST" ? null : eventId;

    const existing = await db.query.certificates.findFirst({
      where: and(
        eq(certificates.userId, userId),
        eq(certificates.templateId, templateId),
        ...(resolvedEventId ? [eq(certificates.eventId, resolvedEventId)] : [])
      ),
    });

    if (existing && existing.status !== "revoked") {
      logger.info(
        { jobId: job.id, certificateId: existing.id },
        "Certificate already exists — skipping duplicate generation"
      );
      return { skipped: true, certificateId: existing.id };
    }

    // ── Fetch Required Data ──────────────────────────────────────────────
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const [templateData] = await db
      .select()
      .from(certTemplates)
      .where(eq(certTemplates.id, templateId))
      .limit(1);

    if (!userData || !templateData) {
      throw new Error(
        `Missing required data for certificate generation. userId=${userId}, templateId=${templateId}`
      );
    }

    let eventTitle = "Club Event";
    if (resolvedEventId) {
      const [eventData] = await db
        .select()
        .from(events)
        .where(eq(events.id, resolvedEventId))
        .limit(1);
      if (eventData) eventTitle = eventData.title;
    }

    // ── Generate PDF ─────────────────────────────────────────────────────
    const renderer = new PdfmeRenderer();
    const verifyCode = crypto.randomBytes(6).toString("hex");
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${verifyCode}`;

    const inputs: Record<string, string> = {
      name: userData.name || userName || "Participant",
      eventName: eventTitle,
      date: new Date().toLocaleDateString(),
      qr: verifyUrl,
    };

    const template = {
      basePdf: templateData.backgroundUrl || "",
      schemas: templateData.fields as any,
    };

    const finalPdfBuffer = await renderer.render(template, [inputs]);

    // ── Upload PDF ───────────────────────────────────────────────────────
    const storage = new LocalMockStorageService();
    const pdfUrl = await storage.uploadFile(
      finalPdfBuffer,
      `certs/${verifyCode}.pdf`,
      "application/pdf"
    );

    // ── Persist Certificate ──────────────────────────────────────────────
    const certificateId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx.insert(certificates).values({
        id: certificateId,
        verifyId: verifyCode,
        userId,
        eventId: resolvedEventId,
        templateId,
        data: inputs,
        pdfUrl,
        issuedBy,
        status: "valid",
      });

      // Audit inside the same transaction
      await tx.insert(auditLogs).values({
        id: crypto.randomUUID(),
        actorId: issuedBy,
        action: "certificate_issue",
        entity: "certificate",
        entityId: certificateId,
        details: JSON.stringify({
          userId,
          eventId: resolvedEventId,
          templateId,
          verifyCode,
          generatedByWorker: true,
          jobId: job.id,
        }),
        timestamp: new Date(),
      });
    });

    // ── Send Email (non-fatal — certificate is saved even if email fails) ─
    const recipientEmail = userData.email || userEmail;
    if (recipientEmail) {
      try {
        await Mailer.sendCertificate(
          recipientEmail,
          eventTitle,
          Buffer.from(finalPdfBuffer)
        );
      } catch (emailErr) {
        logger.error(
          { jobId: job.id, certificateId, err: emailErr },
          "Certificate email failed — certificate was saved successfully"
        );
        // Do NOT rethrow: certificate generation succeeded
      }
    }

    logger.info(
      { jobId: job.id, certificateId, verifyCode },
      "Certificate generated successfully"
    );

    return { certificateId, verifyCode };
  },
  getWorkerConfig()
);

// ── Event Listeners ──────────────────────────────────────────────────────────

certificateWorker.on("completed", (job, result) => {
  logger.info(
    { jobId: job.id, result },
    "Certificate worker job completed"
  );
});

certificateWorker.on("failed", (job, err) => {
  logger.error(
    {
      jobId: job?.id,
      userId: job?.data?.userId,
      eventId: job?.data?.eventId,
      err: { message: err.message, name: err.name },
    },
    "Certificate worker job failed"
  );
});

certificateWorker.on("stalled", (jobId) => {
  logger.warn({ jobId }, "Certificate worker job stalled — will be retried");
});
