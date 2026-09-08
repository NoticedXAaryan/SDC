"use server";

import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations, events } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateSignedPass } from "@/lib/passes/qr";

export async function refreshPassAction(eventId: string, passCode: string) {
  const session = await requireSession();

  // Validate the user owns this registration
  const userRegistration = await db.query.registrations.findFirst({
    where: and(
      eq(registrations.eventId, eventId),
      eq(registrations.userId, session.user.id),
      eq(registrations.passCode, passCode)
    )
  });

  if (!userRegistration || !["confirmed", "checked_in"].includes(userRegistration.status || "")) {
    throw new Error("Invalid or unconfirmed registration");
  }

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event || event.deletedAt || event.status !== "published") throw new Error("This event pass is no longer available");

  return generateSignedPass({
    userId: session.user.id,
    eventId: eventId,
    passCode: passCode
  }, event.endsAt);
}
