import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { performInventoryAction } from "@/lib/services/inventory";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;
  
  const body = await req.json().catch(() => ({}));
  // Map 'id' from route to 'eventId' or 'itemId'
  // Assuming the route is for logging an action for an event, we need the itemId from body
  const actionData = { ...body, eventId: id };
  const result = await performInventoryAction(session, actionData);

  return NextResponse.json(result);
});

