import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  await requireRole(["lead", "co_lead", "admin", "owner"]);
  
  const { id: eventId } = await params;
  
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const eventUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://club.com"}/events/${event.slug}`;
  const dateStr = new Date(event.startsAt).toLocaleDateString();
  const timeStr = new Date(event.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const whatsappMessage = `*📣 Upcoming Event: ${event.title}!*\n\n` +
    `📅 *Date:* ${dateStr}\n` +
    `⏰ *Time:* ${timeStr}\n` +
    (event.location ? `📍 *Location:* ${event.location}\n` : '') +
    `\n${event.description}\n\n` +
    `🔗 *Register here:* ${eventUrl}\n\n` +
    `_Don't miss out!_`;

  return NextResponse.json({ success: true, message: whatsappMessage });
}, { requireRateLimit: false });
