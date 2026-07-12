import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const topUsers = await db.select({
      id: user.id,
      name: user.name,
      points: user.points,
    })
    .from(user)
    .orderBy(desc(user.points))
    .limit(100);

    return NextResponse.json(topUsers);
  } catch (error) {
    console.error("[Leaderboard GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
