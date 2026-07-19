import { NextResponse, NextRequest } from "next/server";
import { requireSession, requireRole, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateEventSchema } from "@/lib/validators/event";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/[id] — Get single event by ID
 */
export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireSession();
  const { id } = await params;

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const isManagement = isManagementRole(session.user.role as string);
  if (event.status !== "published" && !isManagement) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(event);
}, { requireRateLimit: false });

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireRole(["lead", "co_lead", "admin", "owner"]);
const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
await checkEmergencyFreeze(session.user.role as string);
const { id } = await params;

const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

// Co-leads can only edit events they created
if ((session.user.role as string) === "co_lead" && event.createdBy !== session.user.id) {
  return NextResponse.json({ error: "You can only edit events you created" }, { status: 403 });
}

const body = await req.json();
const parsed = updateEventSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid update data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const updateData: Record<string, any> = {};
const data = parsed.data;

if (data.title !== undefined) updateData.title = data.title;
if (data.type !== undefined) updateData.type = data.type;
if (data.domain !== undefined) updateData.domain = data.domain;
if (data.description !== undefined) updateData.description = data.description;
if (data.location !== undefined) updateData.location = data.location;
if (data.capacity !== undefined) updateData.capacity = data.capacity;
if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
if (data.endsAt !== undefined) updateData.endsAt = new Date(data.endsAt);
if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
if (data.price !== undefined) updateData.price = String(data.price);
if (data.visibility !== undefined) updateData.visibility = data.visibility;
if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
if (data.status !== undefined) {
  const { canTransition } = await import("@/lib/dal/auth");
  if (!canTransition(session.user.role, "event", event.status || "draft", data.status)) {
    return NextResponse.json({ error: "Your role cannot transition the event to this status" }, { status: 403 });
  }
  updateData.status = data.status;
}

if (Object.keys(updateData).length === 0) {
  return NextResponse.json({ error: "No fields to update" }, { status: 400 });
}

await db.update(events).set(updateData).where(eq(events.id, id));

await logAuditEvent({
  actorId: session.user.id,
  action: "event_update",
  entity: "event",
  entityId: id,
  details: `Updated fields: ${Object.keys(updateData).join(", ")}`,
});

// Notify registered attendees if significant details changed (time, location, etc.)
// For simplicity, we trigger on any update when the event is published.
if (event.status === "published") {
  const { registrations, user } = await import("@/lib/db/schema");
  const attendees = await db
    .select({
      email: user.email,
      name: user.name,
    })
    .from(registrations)
    .innerJoin(user, eq(registrations.userId, user.id))
    .where(eq(registrations.eventId, id));

  if (attendees.length > 0) {
    const { Mailer } = await import("@/lib/services/mailer");
    const emailHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Event Update: ${updateData.title || event.title}</h2>
            <p>This is to notify you that there have been updates to an event you registered for.</p>
            <p>Please check the latest details on the event page.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/events/${event.slug}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px; margin-top: 20px;">View Event Details</a>
          </div>
        `;

    // Send emails without blocking the response
    Promise.allSettled(
      attendees.map(a => 
        Mailer.sendEmail({
          to: a.email,
          subject: `Event Update: ${updateData.title || event.title}`,
          html: emailHtml
        })
      )
    ).catch(console.error);
  }
}

return NextResponse.json({ success: true, event: { slug: event.slug } });

});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireRole(["admin", "owner"]);
const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
await checkEmergencyFreeze(session.user.role as string);
const { id } = await params;

const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

// Soft delete by setting status to cancelled
await db.update(events)
  .set({ status: "cancelled" })
  .where(eq(events.id, id));

await logAuditEvent({
  actorId: session.user.id,
  action: "event_delete",
  entity: "event",
  entityId: id,
  details: `Cancelled event: ${event.title}`,
});

return NextResponse.json({ success: true, message: "Event cancelled" });

});
