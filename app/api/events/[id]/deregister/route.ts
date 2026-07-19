import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations, events } from "@/lib/db/schema";
import { eq, and, asc, sql } from "drizzle-orm";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler } from "@/lib/api-wrapper";
import { NotificationService } from "@/lib/services/notifications";

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

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (new Date() >= new Date(event.startsAt)) {
    return NextResponse.json({ error: "Cannot deregister after event has started" }, { status: 400 });
  }

  const wasPreviouslyConfirmed = registration.status === "confirmed";

  await db.update(registrations)
    .set({ status: "cancelled" })
    .where(eq(registrations.id, registration.id));

  await logAuditEvent({
    actorId: session.user.id,
    action: "event_deregister",
    entity: "registration",
    entityId: registration.id,
    details: `User deregistered from event: ${event.title}`,
  });

  // Notify the user
  void NotificationService.sendInAppNotification({
    userId: session.user.id,
    type: "event",
    title: "Registration Cancelled",
    message: `Your registration for "${event.title}" has been cancelled.`,
    link: `/events/${event.slug}`,
  });

  // Waitlist auto-promotion: if a confirmed spot opened up, promote the next waitlisted user
  if (wasPreviouslyConfirmed && event.capacity) {
    const [confirmedCount] = await db.select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(and(
        eq(registrations.eventId, eventId),
        eq(registrations.status, "confirmed")
      ));

    if (Number(confirmedCount.count) < event.capacity) {
      // Find the earliest waitlisted registration
      const nextInLine = await db.select()
        .from(registrations)
        .where(and(
          eq(registrations.eventId, eventId),
          eq(registrations.status, "waitlist")
        ))
        .orderBy(asc(registrations.createdAt))
        .limit(1);

      if (nextInLine.length > 0) {
        await db.update(registrations)
          .set({ status: "confirmed" })
          .where(eq(registrations.id, nextInLine[0].id));

        // Notify the promoted user
        void NotificationService.sendInAppNotification({
          userId: nextInLine[0].userId,
          type: "event",
          title: "Waitlist Promotion! 🎉",
          message: `A spot opened up! You've been promoted from the waitlist for "${event.title}".`,
          link: `/events/${event.slug}`,
        });

        await logAuditEvent({
          actorId: "system",
          action: "waitlist_promotion",
          entity: "registration",
          entityId: nextInLine[0].id,
          details: `Auto-promoted user ${nextInLine[0].userId} from waitlist for event: ${event.title}`,
        });
      }
    }
  }

  return NextResponse.json({ success: true, message: "Successfully deregistered" });
});
