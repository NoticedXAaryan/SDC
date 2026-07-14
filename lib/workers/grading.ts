import { Queue, Worker, Job } from "bullmq";
import { db } from "../db";
import { applications } from "../db/schema";
import { gradeApplication } from "../services/ai";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { getRedisConfig } from "@/lib/redis";

const connection = getRedisConfig();



export const gradingWorker = new Worker(
  "ai-grading",
  async (job: Job) => {
    const { applicationId, answers } = job.data;
    logger.info({ jobId: job.id, applicationId }, "Processing application");

    try {
      const result = await gradeApplication(answers, applicationId);
      
      await db.update(applications)
        .set({
          aiScore: result.score,
          aiFeedback: result.feedback,
          status: "ai_graded",
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));
        
      logger.info({ jobId: job.id, applicationId, score: result.score }, "Completed application grading");
    } catch (error) {
      logger.error({ jobId: job.id, applicationId, error }, "Error processing application");
      throw error;
    }
  },
  { connection }
);

gradingWorker.on("failed", async (job, error) => {
  if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
    const { applicationId } = job.data;
    logger.warn({ jobId: job.id, applicationId }, "Grading job max retries reached. Setting needs_manual_review.");
    try {
      await db.update(applications)
        .set({
          status: "needs_manual_review",
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));
    } catch (dbError) {
      logger.error({ jobId: job.id, applicationId, error: dbError }, "Failed to update application status after grading failure");
    }
  }
});
