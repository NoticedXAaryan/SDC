import { Worker, Job } from "bullmq";
import { Mailer } from "@/lib/services/mailer";
import { logger } from "@/lib/logger";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const emailWorker = new Worker("email-queue", async (job: Job) => {
  const { type, payload } = job.data;

  switch (type) {
    case "event_registration":
      await Mailer.sendEventQRPass(payload.email, payload.eventTitle, payload.qrCodeDataUrl);
      break;
    default:
      logger.warn({ type }, "Unknown email job type");
  }
}, { connection });

emailWorker.on('completed', job => {
  logger.info({ jobId: job.id, type: job.data?.type }, "Email job completed successfully");
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, type: job?.data?.type, err }, "Email job failed");
});
