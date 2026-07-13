import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
// Only admins can approve events
const session = await requireRole(["admin", "owner"]);

const { id: eventId } = await params;

// Get the current event
const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

const metadata = (event.metadata as Record<string, any>) || {};

const updatedMetadata = {
  ...metadata,
  approvalStatus: "approved"
};

const [updatedEvent] = await db.update(events)
  .set({
    status: "published",
    metadata: updatedMetadata,
    updatedAt: new Date(),
  })
  .where(eq(events.id, eventId))
  .returning();

await logAuditEvent({
  actorId: session.user.id,
  action: "event_approve",
  entity: "event",
  entityId: eventId,
  details: `Approved and published event request: ${updatedEvent.title}`,
});

return NextResponse.json({ success: true, event: updatedEvent });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Event Approve PATCH]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
