import { Worker, Job } from "bullmq";
import { db } from "@/lib/db";
import { certificates, certificateTemplates, user, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PdfmeRenderer } from "@/lib/services/PdfmeRenderer";
import { LocalMockStorageService } from "@/lib/services/storage";
import crypto from "crypto";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

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

  // Format inputs based on schema
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

  // Generate final PDF
  const finalPdfBuffer = await renderer.render(template, [inputs]);

  // SHA256
  const hash = crypto.createHash("sha256").update(finalPdfBuffer).digest("hex");

  // Upload
  const storage = new LocalMockStorageService();
  const pdfUrl = await storage.uploadFile(finalPdfBuffer, `certs/${verifyCode}.pdf`, "application/pdf");

  // DB Insert
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

}, { connection });

certificateWorker.on('completed', job => {
  console.log(`Certificate job ${job.id} has completed!`);
});

certificateWorker.on('failed', (job, err) => {
  console.error(`Certificate job ${job?.id} has failed with ${err.message}`);
});
