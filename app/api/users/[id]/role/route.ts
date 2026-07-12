import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";

export const dynamic = "force-dynamic";

const VALID_ROLES = [
  "owner", "admin", "lead", "vice_lead", "faculty_coordinator", 
  "event_lead", "content_lead", "marketing_lead", "tech_lead", "finance_lead", "volunteer_lead", 
  "co_lead", "member", "alumni"
];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole(["admin", "owner", "lead"]);
    const currentUserRole = session.user.role as string;
    
    const body = await req.json();
    const { role } = body;
    const { id: targetUserId } = await params;

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Determine permissions
    // Owner can assign anything.
    // Admin can assign anything EXCEPT owner.
    // Lead can assign anything EXCEPT owner, admin, lead, faculty_coordinator.
    
    if (currentUserRole === "admin" && role === "owner") {
      return NextResponse.json({ error: "Admins cannot assign the owner role" }, { status: 403 });
    }

    if (currentUserRole === "lead" && ["owner", "admin", "lead", "faculty_coordinator"].includes(role)) {
      return NextResponse.json({ error: "Leads cannot assign executive roles" }, { status: 403 });
    }

    // Prevent modifying an owner if you are not an owner
    const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    if (targetUser.role === "owner" && currentUserRole !== "owner") {
      return NextResponse.json({ error: "Cannot modify an owner" }, { status: 403 });
    }

    await db.update(user).set({ role }).where(eq(user.id, targetUserId));

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[User Role PATCH]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
