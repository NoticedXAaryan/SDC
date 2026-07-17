import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: eventId } = await params;
    const { reason } = await req.json();
    
    // Using aiDraftMessage as a generic feedback/reason field since it's already a text column
    // Or we could append to checklist/staff/etc., but aiDraftMessage is perfect for draft comments.
    await db.update(events)
      .set({ 
        status: "cancelled", // Treat rejected as cancelled, or we could add "rejected" to enum
        aiDraftMessage: `REJECTED: ${reason}` 
      })
      .where(eq(events.id, eventId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
