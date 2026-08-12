import { NextResponse, NextRequest } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { scanEventPass } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { passCode } = await req.json();
  const { id } = await params;

  if (!passCode) {
    return NextResponse.json({ error: "Passcode is required" }, { status: 400 });
  }

  const result = await scanEventPass(session, id, passCode);
  return NextResponse.json(result);
});
