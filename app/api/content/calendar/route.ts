import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contentItems } from "@/lib/db/schema";
import { isNotNull, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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
  } catch (error) {
    console.error("[Content Calendar GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
