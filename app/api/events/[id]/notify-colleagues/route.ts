import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, user, notifications } from "@/lib/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
// Only leads and admins can notify colleagues
await requireRole(["lead", "co_lead", "admin", "owner"]);

const { id: eventId } = await params;
const body = await req.json().catch(() => ({}));
const { subject, message } = body;

if (!subject || !message) {
  return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
}

const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

// Notify all admins and leads (Colleagues)
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
  type: "colleague_update",
  title: subject,
  message: `${event.title} Update: ${message}`,
  link: `/events/${event.slug}/management`,
}));

if (notifs.length > 0) {
  const chunkSize = 100;
  for (let i = 0; i < notifs.length; i += chunkSize) {
    await db.insert(notifications).values(notifs.slice(i, i + chunkSize));
  }
}

return NextResponse.json({ success: true, count: notifs.length });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Event Notify Colleagues POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
