import { Worker, Job } from "bullmq";
import { Mailer } from "@/lib/services/mailer";
import { logger } from "@/lib/logger";
import { getRedisConfig } from "@/lib/redis";

/**
 * Email worker — processes all email job types from the shared email-queue.
 * 
 * Job types enqueued by:
 * - Event registration flow → "event_registration"
 * - Reminders worker → "event_reminder"  
 * - Reports worker → "report_delivery"
 * - Social worker → "content_reminder"
 */
export const emailWorker = new Worker("email-queue", async (job: Job) => {
  const { type, payload } = job.data;

  switch (type) {
    case "event_registration":
      await Mailer.sendEventQRPass(payload.email, payload.eventTitle, payload.qrCodeDataUrl);
      break;

    case "event_reminder":
      await Mailer.sendEmail({
        to: payload.email,
        subject: `Reminder: ${payload.eventTitle} is tomorrow!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Event Reminder</h2>
            <p>Hi ${payload.name},</p>
            <p>This is a friendly reminder that <strong>${payload.eventTitle}</strong> is happening tomorrow!</p>
            ${payload.location ? `<p><strong>Location:</strong> ${payload.location}</p>` : ""}
            ${payload.startsAt ? `<p><strong>Time:</strong> ${new Date(payload.startsAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>` : ""}
            <p style="font-size: 12px; color: #666; margin-top: 30px;">See you there! — SDC Team</p>
          </div>
        `,
      });
      break;

    case "report_delivery":
      await Mailer.sendEmail({
        to: payload.email,
        subject: payload.subject || "Your SDC Report is Ready",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Weekly Report</h2>
            <p>Your weekly SDC engagement report is ready.</p>
            ${payload.reportUrl ? `<a href="${payload.reportUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Report</a>` : ""}
          </div>
        `,
      });
      break;

    case "content_reminder":
      await Mailer.sendEmail({
        to: payload.email,
        subject: `Content Reminder: "${payload.contentTitle}" scheduled for tomorrow`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Content Publishing Reminder</h2>
            <p>Hi ${payload.name},</p>
            <p>Your content <strong>"${payload.contentTitle}"</strong> is scheduled for publication tomorrow on <strong>${payload.platform || "the platform"}</strong>.</p>
            <p>Please make sure everything is ready to go!</p>
            <p style="font-size: 12px; color: #666; margin-top: 30px;">— SDC Content Team</p>
          </div>
        `,
      });
      break;

    default:
      logger.warn({ type }, "Unknown email job type — job will be discarded");
  }
}, { 
  connection: getRedisConfig(),
  concurrency: 5,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 1000 }
});

emailWorker.on('completed', job => {
  logger.info({ jobId: job.id, type: job.data?.type }, "Email job completed successfully");
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, type: job?.data?.type, err }, "Email job failed");
});
