import { Worker, Job, Queue } from "bullmq";
import { db } from "@/lib/db";
import { contentItems, user } from "@/lib/db/schema";
import { eq, and, isNotNull, lte, gte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { emailQueue } from "@/lib/queues/email";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { getWorkerConfig } from "@/lib/redis";

const connection = getWorkerConfig();

export const socialQueue = new Queue("social-queue", getWorkerConfig());

export const socialWorker = new Worker("social-queue", async (job: Job) => {
  const { type } = job.data;
  
  if (type === "daily_social_reminders") {
    const today = new Date();
    const tomorrowStart = startOfDay(addDays(today, 1));
    const tomorrowEnd = endOfDay(addDays(today, 1));

    const scheduledContent = await db.select({
      id: contentItems.id,
      title: contentItems.title,
      platform: contentItems.platform,
      scheduledFor: contentItems.scheduledFor,
      authorEmail: user.email,
      authorName: user.name,
    })
    .from(contentItems)
    .innerJoin(user, eq(user.id, contentItems.authorId))
    .where(
      and(
        eq(contentItems.status, "scheduled"),
        isNotNull(contentItems.scheduledFor),
        gte(contentItems.scheduledFor, tomorrowStart),
        lte(contentItems.scheduledFor, tomorrowEnd)
      )
    );

    logger.info({ count: scheduledContent.length }, "Found scheduled content for reminders");

    for (const item of scheduledContent) {
      if (!item.authorEmail) continue;
      
      await emailQueue.add("content_reminder", {
        type: "content_reminder",
        payload: {
          email: item.authorEmail,
          name: item.authorName,
          contentTitle: item.title,
          platform: item.platform,
          scheduledFor: item.scheduledFor,
        }
      });
      
      logger.info({ contentId: item.id, email: item.authorEmail }, "Enqueued content reminder");
    }
  }
}, getWorkerConfig());

// Schedule the daily cron job (runs every day at 9:00 AM)
socialQueue.add("daily_social_reminders", { type: "daily_social_reminders" }, {
  repeat: {
    pattern: "0 9 * * *",
  },
  jobId: "daily-social-reminders-job"
}).catch(err => logger.error({ err }, "Failed to schedule social cron"));



