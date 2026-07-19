import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, registrations, user } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { HMACPassValidator } from "@/lib/passes/qr";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const session = await requireSession();
  
  // Check if the user is a lead, owner, or admin
  if (!["owner", "admin", "lead", "co_lead"].includes(session.user.role as string)) {
    throw new AuthorizationError("Unauthorized scanner");
  }

  const { slug } = await params;
  const body = await req.json();
  const { signedPass } = body;

  if (!signedPass) {
    return NextResponse.json({ error: "No pass provided" }, { status: 400 });
  }

  // Verify token
  const validator = new HMACPassValidator();
  const passData = await validator.validate(signedPass);
  if (!passData.valid) {
    return NextResponse.json({ error: "Invalid or tampered pass" }, { status: 400 });
  }

  const { eventId, userId, passCode } = passData;

  if (!eventId || !userId || !passCode) {
    return NextResponse.json({ error: "Invalid pass payload" }, { status: 400 });
  }

  // Get event id from slug
  const eventData = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!eventData.length) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  const event = eventData[0];

  // Ensure the pass belongs to this event
  if (event.id !== eventId) {
    return NextResponse.json({ error: "Pass belongs to a different event" }, { status: 400 });
  }

  // Process check-in transaction
  const result = await db.transaction(async (tx) => {
    const regData = await tx.select().from(registrations)
      .where(
        and(
          eq(registrations.eventId, eventId),
          eq(registrations.userId, userId),
          eq(registrations.passCode, passCode)
        )
      ).limit(1);

    if (!regData.length) {
      return { error: "Registration not found or pass code mismatch", status: 404 };
    }

    const registration = regData[0];

    if (registration.status !== "confirmed") {
      return { error: `User is not confirmed (status: ${registration.status})`, status: 400 };
    }

    if (registration.checkedInAt) {
      return { error: "User is already checked in", status: 400 };
    }

    await tx.update(registrations)
      .set({ status: "checked_in", checkedInAt: new Date() })
      .where(eq(registrations.id, registration.id));

    const userData = await tx.select().from(user).where(eq(user.id, userId)).limit(1);

    return { success: true, user: userData[0] };
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, user: result.user }, { status: 200 });
});
