import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/redis";

export const aiQueue = new Queue("ai-queue", { 
  connection: getRedisClient() as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
  }
});
