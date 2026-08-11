import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { deregisterEvent } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;

  const result = await deregisterEvent(session, id);
  return NextResponse.json(result);
});

