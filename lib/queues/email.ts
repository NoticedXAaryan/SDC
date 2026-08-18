import { Queue } from "bullmq";
import { getRedisClient } from "@/lib/redis";

let _queue: Queue | null = null;

export function getEmailQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("email-queue", {
      connection: getRedisClient() as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: true,
      },
    });
  }
  return _queue;
}

/** @deprecated Prefer getEmailQueue() so queue creation stays lazy. */
export const emailQueue = {
  add: (...args: Parameters<Queue["add"]>) => getEmailQueue().add(...args),
  addBulk: (...args: Parameters<Queue["addBulk"]>) => getEmailQueue().addBulk(...args),
};
