import { Worker, Job } from "bullmq";
import { db } from "../db";
import { events } from "../db/schema";
import { draftCommsForEvent } from "../services/ai";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { env } from "@/lib/env";

const connection = env.REDIS_URL 
  ? { url: env.REDIS_URL }
  : { host: env.REDIS_HOST, port: parseInt(env.REDIS_PORT) };

export const aiWorker = new Worker(
  "ai-queue",
  async (job: Job) => {
    if (job.name === "draft_event_comms") {
      const { eventId, eventDetails } = job.data;
      logger.info({ jobId: job.id, eventId }, "Processing AI event comms draft");

      try {
        const result = await draftCommsForEvent(eventDetails, eventId);
        
        await db.update(events)
          .set({
            aiDraftMessage: result.whatsappMessage,
            aiDraftEmail: result.emailMessage,
          })
          .where(eq(events.id, eventId));
          
        logger.info({ jobId: job.id, eventId }, "Completed event comms draft");
      } catch (error) {
        logger.error({ jobId: job.id, eventId, error }, "Error drafting event comms");
        throw error;
      }
    }
  },
  { connection }
);
