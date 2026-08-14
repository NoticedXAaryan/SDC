import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getRedisClient } from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * GET /api/ready - Readiness probe.
 * Only returns 200 OK if the application is fully ready to serve traffic.
 * Checks actual connectivity to critical dependencies (DB, Redis).
 */
export async function GET() {
  let dbStatus = "unknown";
  let redisStatus = "unknown";
  
  try {
    await db.execute(sql`SELECT 1`);
    dbStatus = "connected";
  } catch (error: any) {
    dbStatus = `fail: ${error.message}`;
  }

  try {
    const redis = getRedisClient();
    if ((redis as any).isMock) {
      redisStatus = "mock (build)";
    } else {
      await redis.ping();
      redisStatus = "connected";
    }
  } catch (error: any) {
    redisStatus = `degraded: ${error.message}`;
  }

  const isDbConfigured = !!process.env.DATABASE_URL;
  const isAuthConfigured = !!process.env.BETTER_AUTH_SECRET && !!process.env.BETTER_AUTH_URL;
  
  const isReady = dbStatus === "connected" && isAuthConfigured;

  return NextResponse.json({
    status: isReady ? "ready" : "not_ready",
    checks: {
      database: dbStatus,
      auth: isAuthConfigured ? "configured" : "missing_secrets",
      redis: redisStatus,
    },
    timestamp: new Date().toISOString()
  }, {
    status: isReady ? 200 : 503
  });
}
