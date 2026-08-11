import { requireSession } from "@/lib/dal/auth";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-wrapper";
import { rejectEvent } from "@/lib/dal/events";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;
  const { reason } = await req.json();
  
  await rejectEvent(session, id, reason);

  return NextResponse.json({ success: true });
});
