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

    // Determine the base URL. If the event is a major event, use its slug as subdomain
    // E.g., techfest.club.com/register
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://club.com";
    
    // For this demonstration, we'll just return standard vs subdomain based link
    let inviteLink = "";
    if (event.capacity && event.capacity > 100) {
      // Major event -> subdomain routing
      const domain = baseUrl.replace("https://", "");
      inviteLink = `https://${event.slug}.${domain}`;
    } else {
      // Standard event
      inviteLink = `${baseUrl}/events/${event.slug}`;
    }

    // append query tracking param
    inviteLink += "?ref=invite";

    return NextResponse.json({ success: true, inviteLink });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Event Invite Link GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
