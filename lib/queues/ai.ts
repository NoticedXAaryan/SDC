import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/redis";

let _queue: Queue | null = null;

export function getAiQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("ai-queue", {
      connection: getRedisClient() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: true,
      },
    });
  }
  return _queue;
}

