import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { getInviteLink } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await requireSession();
  const { id } = await params;
  
  const result = await getInviteLink(session, id);
  return NextResponse.json({ success: true, ...result });
}, { requireRateLimit: false });

