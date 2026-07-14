import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, registrations, events, pointLogs } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/engagement — Aggregate engagement metrics.
 * Requires authentication (internal dashboard data).
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  await requireSession();

  const [userStats] = await db.select({
    totalMembers: sql<number>`count(*)`,
    avgPoints: sql<number>`avg(${user.points})`,
  }).from(user);

  const [registrationStats] = await db.select({
    totalRegistrations: sql<number>`count(*)`,
    checkedIn: sql<number>`count(*) filter (where ${registrations.status} = 'checked_in')`,
  }).from(registrations);

  const [eventStats] = await db.select({
    totalEvents: sql<number>`count(*)`,
    internalEvents: sql<number>`count(*) filter (where ${events.isInternal} = true)`,
  }).from(events);

  const [pointStats] = await db.select({
    totalPointsAwarded: sql<number>`sum(${pointLogs.points})`,
  }).from(pointLogs);

  return NextResponse.json({
    metrics: {
      users: {
        total: Number(userStats?.totalMembers) || 0,
        avgPoints: Number(userStats?.avgPoints) || 0,
      },
      events: {
        total: Number(eventStats?.totalEvents) || 0,
        internal: Number(eventStats?.internalEvents) || 0,
      },
      engagement: {
        totalRSVPs: Number(registrationStats?.totalRegistrations) || 0,
        checkedIn: Number(registrationStats?.checkedIn) || 0,
        attendanceRate: Number(registrationStats?.totalRegistrations) > 0 
          ? (Number(registrationStats?.checkedIn) / Number(registrationStats?.totalRegistrations)) * 100 
          : 0,
      },
      points: {
        totalDistributed: Number(pointStats?.totalPointsAwarded) || 0,
      }
    }
  });
}, { requireRateLimit: false });
