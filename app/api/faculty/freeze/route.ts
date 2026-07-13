import { NextResponse, NextRequest } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { clubSettings } from "@/lib/db/schema";
import { logAuditEvent } from "@/lib/services/audit";
import { eq } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest) => {
try {
const session = await requireRole(["admin", "owner", "faculty_coordinator"]);

const body = await req.json();
if (typeof body.isFrozen !== "boolean") {
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

const { isFrozen } = body;

// UPSERT basically, since we only have one row with id='default'
await db.insert(clubSettings)
  .values({
    id: "default",
    isFrozen,
    updatedBy: session.user.id,
    updatedAt: new Date(),
  })
  .onConflictDoUpdate({
    target: clubSettings.id,
    set: {
      isFrozen,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    }
  });

await logAuditEvent({
  actorId: session.user.id,
  action: (isFrozen ? "club_frozen" : "club_unfrozen") as any,
  entity: "clubSettings" as any,
  entityId: "default",
  details: `Club operations have been ${isFrozen ? "frozen" : "unfrozen"} by faculty/admin.`,
});

return NextResponse.json({ success: true, isFrozen });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Faculty Freeze PATCH]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
