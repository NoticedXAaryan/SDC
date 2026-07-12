import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin", "owner", "lead", "faculty_coordinator"]);
    
    // In a real app we would paginate, but for now just fetch top 200
    const users = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }).from(user).limit(200);

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Users GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
