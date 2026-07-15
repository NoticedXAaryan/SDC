import { Worker, Job } from "bullmq";
import { db } from "@/lib/db";
import { certificates, certificateTemplates, user, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PdfmeRenderer } from "@/lib/services/PdfmeRenderer";
import { LocalMockStorageService } from "@/lib/services/storage";
import { Mailer } from "@/lib/services/mailer";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { getWorkerConfig } from "@/lib/redis";

export const certificateWorker = new Worker("certificate-generation", async (job: Job) => {
  const { userId, eventId, templateId, issuedBy } = job.data;

  // 1. Get user, event, template
  const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  const [eventData] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  const [templateData] = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, templateId)).limit(1);

  if (!userData || !eventData || !templateData) {
    throw new Error("Missing data for certificate generation");
  }

  const renderer = new PdfmeRenderer();
  
  const verifyCode = crypto.randomBytes(6).toString("hex");
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify/${verifyCode}`;

  const inputs: Record<string, any> = {
    name: userData.name,
    eventName: eventData.title,
    date: new Date().toLocaleDateString(),
    qr: verifyUrl
  };
  
  const template = {
    basePdf: templateData.basePdf,
    schemas: templateData.schemas as any,
  };

  const finalPdfBuffer = await renderer.render(template, [inputs]);
  const hash = crypto.createHash("sha256").update(finalPdfBuffer).digest("hex");

  const storage = new LocalMockStorageService();
  const pdfUrl = await storage.uploadFile(finalPdfBuffer, `certs/${verifyCode}.pdf`, "application/pdf");

  await db.insert(certificates).values({
    id: crypto.randomUUID(),
    verifyCode,
    userId,
    eventId,
    templateId,
    pdfUrl,
    hash,
    issuedBy
  });

  // Send the email with the attached certificate
  if (userData.email) {
    await Mailer.sendCertificate(userData.email, eventData.title, Buffer.from(finalPdfBuffer));
  }

}, getWorkerConfig());

certificateWorker.on('completed', job => {
  logger.info({ jobId: job.id, entityId: job.data?.eventId || job.data?.userId }, "Certificate job completed!");
});

certificateWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, entityId: job?.data?.eventId || job?.data?.userId, err }, `Certificate job failed with ${err.message}`);
});



