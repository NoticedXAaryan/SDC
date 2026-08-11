import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { notifyColleagues } from "@/lib/dal/communications";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
  const { id } = await params;
  
  const body = await req.json().catch(() => ({}));
  const result = await notifyColleagues(session, id, body);
  
  return NextResponse.json(result);
});

