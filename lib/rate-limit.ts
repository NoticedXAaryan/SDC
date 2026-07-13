import { RateLimiterRedis } from "rate-limiter-flexible";
import Redis from "ioredis";
import { env } from "@/lib/env";
import { NextRequest } from "next/server";

const redisClient = env.REDIS_URL 
  ? new Redis(env.REDIS_URL, { enableOfflineQueue: false, lazyConnect: true })
  : new Redis({ host: env.REDIS_HOST, port: parseInt(env.REDIS_PORT), enableOfflineQueue: false, lazyConnect: true });

redisClient.on("error", () => {
  // Ignore connection errors, especially during build time
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "ratelimit",
  points: 10, // 10 requests
  duration: 60, // per 60 seconds by IP
});

export async function checkRateLimit(req: NextRequest, keySuffix?: string): Promise<{ success: boolean }> {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const key = keySuffix ? `${ip}_${keySuffix}` : ip;

  try {
    await rateLimiter.consume(key);
    return { success: true };
  } catch (rejRes) {
    return { success: false };
  }
}
