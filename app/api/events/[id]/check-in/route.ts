import { NextResponse, NextRequest } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { checkInEvent } from "@/lib/dal/events";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;
  
  const body = await req.json();
  const { signedPass } = body;

  if (!signedPass) {
    return NextResponse.json({ error: "No pass provided" }, { status: 400 });
  }

  const result: any = await checkInEvent(session, id, signedPass);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ success: true, user: result.user }, { status: 200 });
});

