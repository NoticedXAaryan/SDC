import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateSignedPass } from "@/lib/passes/qr";
import { logAuditEvent } from "@/lib/services/audit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/[id]/register — Register current user for an event
 * Handles capacity checking, waitlist, and QR pass generation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id: eventId } = await params;

    // 1. Get the event
    const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status !== "published") {
      return NextResponse.json({ error: "Event is not open for registration" }, { status: 400 });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 });
    }

    // 2. Check if already registered
    const [existingReg] = await db.select()
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.userId, session.user.id)
        )
      )
      .limit(1);

    if (existingReg) {
      if (existingReg.status === "cancelled") {
        // Allow re-registration after cancellation
      } else {
        return NextResponse.json(
          { error: "Already registered for this event", status: existingReg.status },
          { status: 400 }
        );
      }
    }

    // 3. Check capacity
    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.status, "confirmed")
        )
      );

    const confirmedCount = Number(countResult.count);
    const hasCapacity = !event.capacity || confirmedCount < event.capacity;

    const regStatus = hasCapacity ? "confirmed" : "waitlist";
    const passCode = crypto.randomBytes(8).toString("hex");
    const regId = existingReg?.id || crypto.randomUUID();

    if (existingReg) {
      // Re-register (was cancelled)
      await db.update(registrations)
        .set({
          status: regStatus,
          passCode,
        })
        .where(eq(registrations.id, regId));
    } else {
      // New registration
      await db.insert(registrations).values({
        id: regId,
        eventId,
        userId: session.user.id,
        status: regStatus,
        passCode,
      });
    }

    // Removed update to registeredCount as it does not exist in the schema. 
    // The count should be calculated dynamically.

    // 4. Generate QR pass token (only for confirmed)
    let passToken: string | null = null;
    if (regStatus === "confirmed") {
      passToken = generateSignedPass({
        eventId,
        userId: session.user.id,
        passCode,
      });
    }

    await logAuditEvent({
      actorId: session.user.id,
      action: "registration_create",
      entity: "registration",
      entityId: regId,
      details: `Registered for event "${event.title}" with status: ${regStatus}`,
    });

    return NextResponse.json({
      success: true,
      registrationId: regId,
      status: regStatus,
      passToken,
      message: regStatus === "confirmed"
        ? "Registration confirmed! Your QR pass is ready."
        : `You're on the waitlist (position ${confirmedCount - (event.capacity || 0) + 1}).`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Event Register POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
