import { Worker, Job } from "bullmq";
import { Mailer } from "@/lib/services/mailer";
import { logger } from "@/lib/logger";
import { getWorkerConfig } from "@/lib/redis";
import { db } from "@/lib/db";
import { communications, registrations, user } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";

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

    case "broadcast_communication":
      {
        const { commId, eventId, subject, body, targetAudience } = payload;
        
        // Find users to broadcast to
        const conditions = targetAudience !== "all" 
          ? and(eq(registrations.eventId, eventId), eq(registrations.status, targetAudience))
          : eq(registrations.eventId, eventId);

        const audience = await db.select({ email: user.email })
          .from(registrations)
          .innerJoin(user, eq(registrations.userId, user.id))
          .where(conditions);

        let successCount = 0;

        for (const recipient of audience) {
          try {
            await Mailer.sendEmail({
              to: recipient.email,
              subject,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <p>${body.replace(/\n/g, "<br>")}</p>
                  <p style="font-size: 12px; color: #666; margin-top: 30px;">This is an automated announcement from SDC.</p>
                </div>
              `,
            });
            successCount++;
          } catch (e) {
            logger.error({ email: recipient.email, commId, error: e }, "Failed to send broadcast email to recipient");
          }
        }

        // Update communication status
        await db.update(communications)
          .set({ status: "sent", sentCount: successCount })
          .where(eq(communications.id, commId));
      }
      break;

    case "broadcast_announcement":
      {
        const { commId, senderId, subject, body } = payload;
        const audience = await db.select({ email: user.email })
          .from(user)
          .where(ne(user.role, "outsider"));
        const escapedBody = String(body).replace(
          /[&<>"']/g,
          (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[character] ?? character,
        );
        let successCount = 0;

        for (const recipient of audience) {
          try {
            await Mailer.sendEmail({
              to: recipient.email,
              subject,
              html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"><p>${escapedBody.replace(/\n/g, "<br>")}</p><p style="font-size: 12px; color: #666; margin-top: 30px;">This is an automated announcement from SDC.</p></div>`,
            });
            successCount++;
          } catch (error) {
            logger.error({ email: recipient.email, commId, error }, "Failed to send announcement email");
          }
        }

        const status = successCount === audience.length ? "sent" : "partial";
        await db.update(communications)
          .set({ status, sentCount: successCount })
          .where(eq(communications.id, commId));
        await logAuditEvent({
          actorId: senderId,
          action: "communication_sent",
          entity: "communication",
          entityId: commId,
          details: JSON.stringify({ kind: "announcement", successCount, recipientCount: audience.length, status }),
        });
      }
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
  ...getWorkerConfig(),
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



