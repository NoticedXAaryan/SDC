import { Queue, Worker, Job } from "bullmq";
import { db } from "../db";
import { applications } from "../db/schema";
import { gradeApplication } from "../services/ai";
import { eq } from "drizzle-orm";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const gradingQueue = new Queue("ai-grading", { connection });

export const gradingWorker = new Worker(
  "ai-grading",
  async (job: Job) => {
    const { applicationId, answers } = job.data;
    console.log(`[Grading] Processing application: ${applicationId}`);

    try {
      const result = await gradeApplication(answers);
      
      await db.update(applications)
        .set({
          aiScore: result.score,
          aiFeedback: result.feedback,
          status: "ai_graded",
          updatedAt: new Date(),
        })
        .where(eq(applications.id, applicationId));
        
      console.log(`[Grading] Completed ${applicationId} with score: ${result.score}`);
    } catch (error) {
      console.error(`[Grading] Error processing ${applicationId}:`, error);
      throw error;
    }
  },
  { connection }
);
