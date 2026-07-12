import { Worker, Job } from "bullmq";
import { Mailer } from "@/lib/services/mailer";

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
      console.warn("Unknown email job type:", type);
  }
}, { connection });

emailWorker.on('completed', job => {
  console.log(`Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err);
});
