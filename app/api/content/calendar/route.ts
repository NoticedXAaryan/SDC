import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { isNotNull, desc } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/content/calendar — Content calendar view.
 * Requires authentication (internal content planning data).
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  await requireSession();

  const items = await db.select({
    id: contentItems.id,
    title: contentItems.title,
    platform: contentItems.platform,
    status: contentItems.status,
    scheduledFor: contentItems.scheduledFor,
  })
  .from(contentItems)
  .where(isNotNull(contentItems.scheduledFor))
  .orderBy(desc(contentItems.scheduledFor));

  // Group by YYYY-MM-DD
  const calendarView: Record<string, any[]> = {};
  for (const item of items) {
    if (item.scheduledFor) {
      const dateStr = item.scheduledFor.toISOString().split("T")[0];
      if (!calendarView[dateStr]) calendarView[dateStr] = [];
      calendarView[dateStr].push(item);
    }
  }

  return NextResponse.json(calendarView);
}, { requireRateLimit: false });
