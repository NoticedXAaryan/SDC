import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/redis";

export const emailQueue = new Queue("email-queue", { 
  connection: getRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
  }
});
