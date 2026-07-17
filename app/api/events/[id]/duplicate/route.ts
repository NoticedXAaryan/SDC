import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    if (!isManagementRole(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id: eventId } = await params;
    
    const existing = await db.select().from(events).where(eq(events.id, eventId));
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const e = existing[0];
    const newSlug = `${e.slug}-copy-${Date.now()}`;
    const newTitle = `Copy of ${e.title}`;

    const inserted = await db.insert(events).values({
      ...e,
      id: undefined, // Let it generate a new ID
      title: newTitle,
      slug: newSlug,
      status: "draft", // Always draft for copies
      createdAt: undefined,
      updatedAt: undefined,
    }).returning();

    return NextResponse.json({ event: inserted[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
