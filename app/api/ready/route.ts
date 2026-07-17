import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/ready - Readiness probe.
 * Only returns 200 OK if the application is fully ready to serve traffic.
 * Can check if critical dependencies (like Better Auth or DB) are actually configured.
 */
export async function GET() {
  // Check if critical env variables are present to determine readiness
  const isDbConfigured = !!process.env.DATABASE_URL;
  const isAuthConfigured = !!process.env.BETTER_AUTH_SECRET && !!process.env.BETTER_AUTH_URL;
  const isRedisConfigured = !!process.env.REDIS_URL || !!process.env.REDIS_HOST;
  
  const isReady = isDbConfigured && isAuthConfigured && isRedisConfigured;

  return NextResponse.json({
    status: isReady ? "ready" : "not_ready",
    checks: {
      database: isDbConfigured ? "configured" : "missing_url",
      auth: isAuthConfigured ? "configured" : "missing_secrets",
      redis: isRedisConfigured ? "configured" : "missing_url",
    },
    timestamp: new Date().toISOString()
  }, {
    status: isReady ? 200 : 503
  });
}
