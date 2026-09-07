import { RateLimiterRedis } from "rate-limiter-flexible";
import { getRedisClient } from "@/lib/redis";
import { NextRequest } from "next/server";

let rateLimiter: RateLimiterRedis | null = null;

export function getClientIp(req: Pick<NextRequest, "headers">): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const firstForwardedIp = forwardedFor?.split(",", 1)[0]?.trim();
  return firstForwardedIp || req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

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
  const ip = getClientIp(req);
  const key = keySuffix ? `${ip}_${keySuffix}` : ip;

  try {
    await getRateLimiter().consume(key);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      // Production must not silently disable abuse protection.
      console.warn("Rate limit redis error:", error.message);
      if (process.env.NODE_ENV === "production") return { success: false, error: "Service temporarily unavailable" };
      return { success: true };
    }
    // Rate limit exceeded
    return { success: false, error: "Too many requests" };
  }
}
