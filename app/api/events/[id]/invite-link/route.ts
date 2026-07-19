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

  // Determine the base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://club.com";
  
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
}, { requireRateLimit: false });
