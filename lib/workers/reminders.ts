import { Worker, Job, Queue } from "bullmq";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { emailQueue } from "@/lib/queues/email";
import { startOfDay, endOfDay, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const remindersQueue = new Queue("reminders-queue", { connection });

export const remindersWorker = new Worker("reminders-queue", async (job: Job) => {
  const { type } = job.data;
  
  if (type === "daily_event_reminders") {
    // Find all events starting tomorrow (Asia/Kolkata timezone standard)
    const today = new Date();
    const tomorrow = addDays(today, 1);
    
    // We should do this strictly in UTC mapped to start/end of day tomorrow
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    const upcomingEvents = await db.select().from(events)
      .where(
        and(
          eq(events.status, "published"),
          gte(events.startsAt, tomorrowStart),
          lt(events.startsAt, tomorrowEnd)
        )
      );

    logger.info({ count: upcomingEvents.length }, "Found upcoming events for reminders");

    for (const event of upcomingEvents) {
      // Find all confirmed registrations
      const attendees = await db.select({
        email: user.email,
        name: user.name,
      })
      .from(registrations)
      .innerJoin(user, eq(user.id, registrations.userId))
      .where(
        and(
          eq(registrations.eventId, event.id),
          eq(registrations.status, "confirmed")
        )
      );

      for (const attendee of attendees) {
        if (!attendee.email) continue;
        
        await emailQueue.add("event_reminder", {
          type: "event_reminder",
          payload: {
            email: attendee.email,
            name: attendee.name,
            eventTitle: event.title,
            startsAt: event.startsAt,
            location: event.location,
          }
        });
      }
      
      logger.info({ eventId: event.id, sentCount: attendees.length }, "Enqueued reminders for event");
    }
  }
}, { connection });

// Schedule the daily cron job (runs every day at 8:00 AM)
remindersQueue.add("daily_event_reminders", { type: "daily_event_reminders" }, {
  repeat: {
    pattern: "0 8 * * *",
  },
  jobId: "daily-event-reminders-job" // ensures it doesn't duplicate
}).catch(err => logger.error({ err }, "Failed to schedule reminders cron"));

remindersWorker.on('completed', job => {
  logger.info({ jobId: job.id, type: job.data?.type }, "Reminder job completed successfully");
});

remindersWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, type: job?.data?.type, err }, "Reminder job failed");
});
