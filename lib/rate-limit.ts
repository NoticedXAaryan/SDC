import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "@/lib/redis";
import { NextRequest } from "next/server";

let rateLimiter: RateLimiterRedis | null = null;

function getRateLimiter() {
  if (!rateLimiter) {
    rateLimiter = new RateLimiterRedis({
      storeClient: getRedisClient(),
      keyPrefix: "ratelimit",
      points: 10, // 10 requests
      duration: 60, // per 60 seconds by IP
    });
  }
  return rateLimiter;
}

export async function checkRateLimit(req: NextRequest, keySuffix?: string): Promise<{ success: boolean, error?: string }> {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const key = keySuffix ? `${ip}_${keySuffix}` : ip;

  try {
    await getRateLimiter().consume(key);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      // Redis connection error -> fail closed
      return { success: false, error: "Service temporarily unavailable" };
    }
    // Rate limit exceeded
    return { success: false, error: "Too many requests" };
  }
}
