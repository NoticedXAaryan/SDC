import { Queue } from "bullmq";
import { getRedisConfig } from "@/lib/redis";

export const gradingQueue = new Queue("ai-grading", { 
  connection: getRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  }
});