import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { eventSessions, events, user, notifications } from "@/lib/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/services/audit";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole(["lead", "co_lead", "admin", "owner"]);
    const { id: eventId } = await params;
    
    const body = await req.json();
    const { title, description, startTime, endTime, meetingLink } = body;

    if (!title || !startTime || !endTime || !meetingLink) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const sessionId = crypto.randomUUID();
    await db.insert(eventSessions).values({
      id: sessionId,
      eventId,
      title: `[Internal Meeting] ${title}`,
      description,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location: meetingLink, // store link in location
    });

    // Notify all admins and leads
    const colleagues = await db.select({ id: user.id })
      .from(user)
      .where(
        or(
          ilike(user.role, "%lead%"),
          eq(user.role, "admin"),
          eq(user.role, "owner")
        )
      );

    const notifs = colleagues.map(c => ({
      id: crypto.randomUUID(),
      userId: c.id,
      type: "internal_meeting",
      title: `Internal Meeting: ${title}`,
      message: `A new internal meeting has been scheduled for ${event.title}. Link: ${meetingLink}`,
      link: `/events/${event.slug}/management`,
    }));

    if (notifs.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < notifs.length; i += chunkSize) {
        await db.insert(notifications).values(notifs.slice(i, i + chunkSize));
      }
    }

    await logAuditEvent({
      actorId: session.user.id,
      action: "event_meeting_schedule",
      entity: "eventSessions",
      entityId: sessionId,
      details: `Scheduled internal meeting for event: ${eventId}`,
    });

    return NextResponse.json({ success: true, sessionId }, { status: 201 });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Event Meetings POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
