import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateSignedPass } from "@/lib/passes/qr";
import { logAuditEvent } from "@/lib/services/audit";
import { emailQueue } from "@/lib/queues/email";
import crypto from "crypto";

import { checkRateLimit } from "@/lib/rate-limit";

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
    const rl = await checkRateLimit(req, "register");
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await requireSession();
    const { id: eventId } = await params;

    // 1. Transaction to lock event and ensure capacity checks are atomic
    const result = await db.transaction(async (tx) => {
      // Use raw SQL for row-level locking
      const { rows } = await tx.execute(
        sql`SELECT * FROM ${events} WHERE id = ${eventId} FOR UPDATE`
      );
      const event = rows[0] as any;

      if (!event) {
        return { error: "Event not found", status: 404 };
      }

      if (event.status !== "published") {
        return { error: "Event is not open for registration", status: 400 };
      }

      if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
        return { error: "Registration deadline has passed", status: 400 };
      }

      const [existingReg] = await tx.select()
        .from(registrations)
        .where(
          and(
            eq(registrations.eventId, eventId),
            eq(registrations.userId, session.user.id)
          )
        )
        .limit(1);

      if (existingReg && existingReg.status !== "cancelled") {
        return { 
          error: "Already registered for this event", 
          status: 400, 
          regStatus: existingReg.status 
        };
      }

      const [countResult] = await tx.select({ count: sql<number>`count(*)` })
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
        await tx.update(registrations)
          .set({ status: regStatus, passCode })
          .where(eq(registrations.id, regId));
      } else {
        // Unique constraint on (eventId, userId) will also prevent duplicates here
        await tx.insert(registrations).values({
          id: regId,
          eventId,
          userId: session.user.id,
          status: regStatus,
          passCode,
        });
      }

      return { 
        success: true, 
        event, 
        regId, 
        regStatus, 
        passCode, 
        confirmedCount 
      };
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error, status: result.regStatus }, 
        { status: result.status }
      );
    }

    const { event, regId, regStatus, passCode, confirmedCount } = result;

    // Removed update to registeredCount as it does not exist in the schema. 
    // The count should be calculated dynamically.

    // 4. Generate QR pass token (only for confirmed)
    let passToken: string | null = null;
    if (regStatus === "confirmed") {
      passToken = generateSignedPass({
        eventId,
        userId: session.user?.id as string,
        passCode: passCode as string,
      });
    }

    await logAuditEvent({
      actorId: session.user?.id as string,
      action: "registration_create",
      entity: "registration",
      entityId: regId as string,
      details: `Registered for event "${event.title}" with status: ${regStatus}`,
    });

    if (regStatus === "confirmed" && passToken) {
      // Fire and forget - background queue
      void emailQueue.add("send-qr-pass", {
        type: "event_registration",
        payload: {
          email: session.user.email,
          eventTitle: event.title,
          qrCodeDataUrl: passToken, // The token acts as the QR pass data
        }
      }, { jobId: crypto.createHash("sha256").update(`event_registration:${regId}`).digest("hex") });
    }

    return NextResponse.json({
      success: true,
      registrationId: regId,
      status: regStatus,
      passToken,
      message: regStatus === "confirmed"
        ? "Registration confirmed! Your QR pass is ready."
        : `You're on the waitlist (position ${(confirmedCount || 0) - (event.capacity || 0) + 1}).`,
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Event Register POST]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
