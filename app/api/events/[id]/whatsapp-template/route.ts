import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["lead", "co_lead", "admin", "owner"]);
    
    const { id: eventId } = await params;
    
    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventUrl = `https://club.com/events/${event.slug}`; // replace with actual domain
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
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Event WhatsApp Template GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
