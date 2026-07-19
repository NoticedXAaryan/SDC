import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    throw new AuthorizationError("Only admins can reject events");
  }

  const { id: eventId } = await params;
  const { reason } = await req.json();
  
  // Using aiDraftMessage as a generic feedback/reason field since it's already a text column
  await db.update(events)
    .set({ 
      status: "cancelled", // Treat rejected as cancelled
      aiDraftMessage: `REJECTED: ${reason}` 
    })
    .where(eq(events.id, eventId));

  return NextResponse.json({ success: true });
});
