import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "@/lib/redis";
import { NextRequest } from "next/server";

const rateLimiter = new RateLimiterRedis({
  storeClient: getRedisClient(),
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
