import { NextResponse, NextRequest } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { updateEventSchema } from "@/lib/validators/event";
import { withApiHandler } from "@/lib/api-wrapper";
import { getEventById, updateEvent, deleteEvent } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/events/[id] — Get single event by ID
 */
export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireSession();
  const { id } = await params;

  const event = await getEventById(session, id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}, { requireRateLimit: false });

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;

  const body = await req.json();
  const parsed = updateEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await updateEvent(session, id, parsed.data);
  if (!result) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(result);
});

export const DELETE = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;

  const result = await deleteEvent(session, id);
  if (!result) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json(result);
});
