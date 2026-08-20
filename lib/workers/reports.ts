import { Worker, Job, Queue } from "bullmq";
import { logger } from "@/lib/logger";
import { getWorkerConfig } from "@/lib/redis";

export const reportsQueue = new Queue("reports-queue", getWorkerConfig());

export const reportsWorker = new Worker("reports-queue", async (job: Job) => {
  const { type, recipientEmail } = job.data;
  
  if (type === "weekly_report") {
    logger.info("Generating weekly engagement report...");

    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const db = (await import("@/lib/db")).db;
      const { user, registrations, events } = await import("@/lib/db/schema");
      const { gte, and, lte, count } = await import("drizzle-orm");

      // 1. Member growth
      const newMembersResult = await db.select({ value: count() }).from(user).where(gte(user.createdAt, oneWeekAgo));
      const newMembers = newMembersResult[0]?.value || 0;

      // 2. Registrations this week
      const newRegistrationsResult = await db.select({ value: count() }).from(registrations).where(gte(registrations.createdAt, oneWeekAgo));
      const newRegistrations = newRegistrationsResult[0]?.value || 0;

      // 3. Events happening this past week
      const eventsThisWeekResult = await db.select({ value: count() }).from(events).where(
        and(gte(events.startsAt, oneWeekAgo), lte(events.startsAt, now))
      );
      const eventsThisWeek = eventsThisWeekResult[0]?.value || 0;

      // 4. Events upcoming next week
      const upcomingEventsResult = await db.select({ value: count() }).from(events).where(
        and(gte(events.startsAt, now), lte(events.startsAt, oneWeekFromNow))
      );
      const upcomingEvents = upcomingEventsResult[0]?.value || 0;

      const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #111; border-bottom: 1px solid #eaeaea; padding-bottom: 10px;">Weekly Engagement Report</h2>
          <p>Here is your summary of SDC operations over the past 7 days:</p>
          
          <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <tr style="background: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #eaeaea;"><strong>New Members</strong></td>
              <td style="padding: 12px; border: 1px solid #eaeaea; text-align: right;">${newMembers}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #eaeaea;"><strong>New Registrations</strong></td>
              <td style="padding: 12px; border: 1px solid #eaeaea; text-align: right;">${newRegistrations}</td>
            </tr>
            <tr style="background: #f9f9f9;">
              <td style="padding: 12px; border: 1px solid #eaeaea;"><strong>Events Held</strong></td>
              <td style="padding: 12px; border: 1px solid #eaeaea; text-align: right;">${eventsThisWeek}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #eaeaea;"><strong>Upcoming Events (Next 7 days)</strong></td>
              <td style="padding: 12px; border: 1px solid #eaeaea; text-align: right;">${upcomingEvents}</td>
            </tr>
          </table>
          
          <p style="margin-top: 30px;">Keep up the great work!</p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">This is an automated report from the SDC Platform.</p>
        </div>
      `;

      const { getEmailQueue } = await import("@/lib/queues/email");
      
      // We will create a new job type or just use the generic email sender
      const { Mailer } = await import("@/lib/services/mailer");
      await Mailer.sendEmail({
        to: recipientEmail,
        subject: "SDC Weekly Engagement Report",
        html: htmlBody,
      });

      logger.info({ recipientEmail }, "Weekly report sent successfully.");
    } catch (error) {
      logger.error({ error }, "Failed to generate weekly report");
      throw error;
    }
  }
}, getWorkerConfig());

reportsQueue.add("weekly_report", { 
  type: "weekly_report", 
  recipientEmail: process.env.ADMIN_EMAIL || "lead@example.com"
}, {
  repeat: { pattern: "0 8 * * 1" },
  jobId: "weekly-report-job"
}).catch(err => logger.error({ err }, "Failed to schedule weekly report cron"));
