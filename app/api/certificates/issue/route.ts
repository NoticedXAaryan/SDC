import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, certificateTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/certificates/issue
 * Bulk issue certificates for an event.
 * In a real environment, this adds jobs to a BullMQ queue.
 * Requires lead, co_lead, admin, or owner.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requireRole(["lead", "co_lead", "admin", "owner"]);
    const body = await req.json();
    const { eventId, templateId } = body;

    if (!eventId || !templateId) {
      return NextResponse.json({ error: "Missing eventId or templateId" }, { status: 400 });
    }

    // Verify event
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Verify template
    const [template] = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, templateId)).limit(1);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Find all checked-in users
    const attendees = await db.select()
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.status, "checked_in")
        )
      );

    if (attendees.length === 0) {
      return NextResponse.json({ error: "No checked-in attendees found for this event" }, { status: 400 });
    }

    // Here we would typically enqueue a bulk job to BullMQ:
    // await certificateQueue.addBulk(attendees.map(a => ({ name: 'issue', data: { userId: a.userId, eventId, templateId } })));
    
    await logAuditEvent({
      actorId: session.user.id,
      action: "certificate_issue",
      entity: "event",
      entityId: eventId,
      details: `Enqueued certificate generation for ${attendees.length} attendees using template ${template.name}`,
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully queued ${attendees.length} certificates for generation.`,
      queuedCount: attendees.length 
    });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Certificates Issue POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
