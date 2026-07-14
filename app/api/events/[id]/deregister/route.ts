import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireSession();
const { id: eventId } = await params;

// Find the registration
const registration = await db.query.registrations.findFirst({
  where: and(
    eq(registrations.eventId, eventId),
    eq(registrations.userId, session.user.id)
  )
});

if (!registration) {
  return NextResponse.json({ error: "Registration not found" }, { status: 404 });
}

if (registration.status === "cancelled") {
  return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
}

// Event check - cannot deregister if event has already started
const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (event && new Date() >= new Date(event.startsAt)) {
  return NextResponse.json({ error: "Cannot deregister after event has started" }, { status: 400 });
}

const [updatedRegistration] = await db.update(registrations)
  .set({
    status: "cancelled",
  })
  .where(eq(registrations.id, registration.id))
  .returning();

await logAuditEvent({
  actorId: session.user.id,
  action: "event_deregister",
  entity: "registration",
  entityId: registration.id,
  details: `User deregistered from event: ${eventId}`,
});

return NextResponse.json({ success: true, message: "Successfully deregistered" });
});
