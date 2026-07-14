import { Queue } from "bullmq";
import { getRedisConfig } from "@/lib/redis";

export const aiQueue = new Queue("ai-queue", { 
  connection: getRedisConfig(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: true,
  }
});
