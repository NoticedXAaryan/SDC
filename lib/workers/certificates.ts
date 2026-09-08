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
import { getStorageService } from "@/lib/services/storage";
import { Mailer } from "@/lib/services/mailer";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { getWorkerConfig } from "@/lib/redis";
import { env } from "@/lib/env";
import fs from "node:fs/promises";
import path from "node:path";
import { isIP } from "node:net";
import { z } from "zod";

const certificateJobSchema = z.object({
  userId: z.string().min(1),
  eventId: z.string().min(1),
  templateId: z.string().min(1),
  issuedBy: z.string().min(1),
  userName: z.string().optional().nullable(),
  userEmail: z.string().email().optional().nullable(),
});

async function resolveBasePdf(value: string): Promise<string | Uint8Array> {
  if (!value) throw new Error("Certificate template has no base PDF.");
  if (value.startsWith("data:application/pdf;base64,")) return value;

  if (value.startsWith("/uploads/")) {
    const uploadsRoot = path.resolve(process.cwd(), "public", "uploads");
    const fullPath = path.resolve(process.cwd(), "public", value.replace(/^\/+/, ""));
    if (!fullPath.startsWith(`${uploadsRoot}${path.sep}`)) throw new Error("Invalid certificate base PDF path.");
    return new Uint8Array(await fs.readFile(fullPath));
  }

  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Unsupported certificate base PDF URL.");
  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const ipVersion = isIP(hostname);
  const isPrivateIpv4 = ipVersion === 4 && (
    hostname.startsWith("10.") || hostname.startsWith("127.") || hostname.startsWith("169.254.") ||
    hostname.startsWith("192.168.") || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
  const isPrivateIpv6 = ipVersion === 6 && (hostname === "::1" || hostname.startsWith("fc") || hostname.startsWith("fd") || hostname.startsWith("fe80:"));
  if (hostname === "localhost" || hostname.endsWith(".local") || isPrivateIpv4 || isPrivateIpv6) {
    throw new Error("Certificate base PDF URL points to a private network address.");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Certificate base PDF download failed (${response.status}).`);
  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > 20 * 1024 * 1024) throw new Error("Certificate base PDF exceeds 20MB.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("Certificate base PDF exceeds 20MB.");
  return bytes;
}

export const certificateWorker = new Worker(
  "certificate-generation",
  async (job: Job) => {
    const { userId, eventId, templateId, issuedBy, userName, userEmail } = certificateJobSchema.parse(job.data);

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

    if (existing && existing.status !== "revoked" && existing.emailSentAt) {
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
    const activeExisting = existing?.status === "valid" ? existing : null;
    const verifyCode = activeExisting?.verifyId || crypto.randomBytes(16).toString("hex");
    const verifyUrl = `${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify/${verifyCode}`;

    const inputs: Record<string, string> = {
      name: userData.name || userName || "Participant",
      eventName: eventTitle,
      date: new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
      certificateId: verifyCode,
      qr: verifyUrl,
    };

    const template = {
      basePdf: await resolveBasePdf(templateData.backgroundUrl || ""),
      schemas: templateData.fields as any,
    };

    const finalPdfBuffer = await renderer.render(template, [inputs]);

    // ── Upload PDF ───────────────────────────────────────────────────────
    const storage = getStorageService();
    const pdfUrl = await storage.uploadFile(
      finalPdfBuffer,
      `certs/${verifyCode}.pdf`,
      "application/pdf"
    );

    // ── Persist Certificate ──────────────────────────────────────────────
    const certificateId = activeExisting?.id || crypto.randomUUID();

    if (activeExisting) {
      await db.update(certificates).set({ data: inputs, pdfUrl }).where(eq(certificates.id, certificateId));
    } else {
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

        await tx.insert(auditLogs).values({
          id: crypto.randomUUID(),
          actorId: issuedBy,
          action: "certificate_issue",
          entity: "certificate",
          entityId: certificateId,
          details: JSON.stringify({ userId, eventId: resolvedEventId, templateId, verifyCode, generatedByWorker: true, jobId: job.id }),
          timestamp: new Date(),
        });
      });
    }

    // ── Send Email (non-fatal — certificate is saved even if email fails) ─
    const recipientEmail = userData.email || userEmail;
    if (!recipientEmail) throw new Error(`Certificate recipient ${userId} has no email address.`);
    try {
      await Mailer.sendCertificate(recipientEmail, eventTitle, Buffer.from(finalPdfBuffer), verifyUrl);
      await db.update(certificates).set({
        emailSentAt: new Date(),
        emailAttempts: (activeExisting?.emailAttempts || 0) + 1,
        emailLastError: null,
      }).where(eq(certificates.id, certificateId));
    } catch (emailErr) {
      const message = emailErr instanceof Error ? emailErr.message : "Unknown email delivery error";
      await db.update(certificates).set({
        emailAttempts: (activeExisting?.emailAttempts || 0) + 1,
        emailLastError: message.slice(0, 1000),
      }).where(eq(certificates.id, certificateId));
      logger.error({ jobId: job.id, certificateId, err: emailErr }, "Certificate email failed — retrying job");
      throw emailErr;
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
