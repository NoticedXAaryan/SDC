import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/redis";

export const gradingQueue = new Queue("ai-grading", { 
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  }
});