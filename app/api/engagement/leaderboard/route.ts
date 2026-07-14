import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/engagement/leaderboard — Top 100 users by points.
 * Requires authentication (internal data).
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  await requireSession();

  const topUsers = await db.select({
    id: user.id,
    name: user.name,
    points: user.points,
  })
  .from(user)
  .orderBy(desc(user.points))
  .limit(100);

  return NextResponse.json(topUsers);
}, { requireRateLimit: false });
