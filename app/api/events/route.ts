import { NextResponse, NextRequest } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { createEventSchema, eventSearchSchema } from "@/lib/validators/event";
import { withApiHandler } from "@/lib/api-wrapper";
import { getEvents, createEvent } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

/**
 * GET /api/events — List events with filters and pagination
 */
export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  
  const url = new URL(req.url);
  const params = eventSearchSchema.safeParse({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    search: url.searchParams.get("search"),
    type: url.searchParams.get("type"),
    status: url.searchParams.get("status"),
    domain: url.searchParams.get("domain"),
    upcoming: url.searchParams.get("upcoming"),
  });

  if (!params.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: params.error.flatten() },
      { status: 400 }
    );
  }

  const result = await getEvents(session, params.data as any);
  return NextResponse.json(result);
}, { requireRateLimit: false });

/**
 * POST /api/events — Create a new event
 */
export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const body = await req.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid event data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await createEvent(session, parsed.data);
  return NextResponse.json(result, { status: 201 });
});
