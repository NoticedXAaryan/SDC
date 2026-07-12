"use server";

import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { registrations } from "@/lib/db/schema";
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

  if (!userRegistration || userRegistration.status !== "confirmed") {
    throw new Error("Invalid or unconfirmed registration");
  }

  return generateSignedPass({
    userId: session.user.id,
    eventId: eventId,
    passCode: passCode
  });
}
