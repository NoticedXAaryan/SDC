import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
const session = await requireRole(["lead", "co_lead", "admin", "owner"]);

const { id: eventId } = await params;
const body = await req.json().catch(() => ({}));
const { report, driveLink } = body;

if (!report && !driveLink) {
  return NextResponse.json({ error: "Provide at least a report or a driveLink" }, { status: 400 });
}

const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

const metadata = (event.metadata as Record<string, any>) || {};

const updatedMetadata = {
  ...metadata,
  postEventReport: report || metadata.postEventReport,
  driveLink: driveLink || metadata.driveLink,
};

const [updatedEvent] = await db.update(events)
  .set({
    metadata: updatedMetadata,
    updatedAt: new Date(),
  })
  .where(eq(events.id, eventId))
  .returning();

await logAuditEvent({
  actorId: session.user.id,
  action: "event_post_event_update",
  entity: "event",
  entityId: eventId,
  details: `Updated post-event details for event: ${updatedEvent.title}`,
});

return NextResponse.json({ success: true, event: updatedEvent });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Event Post-Event POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
