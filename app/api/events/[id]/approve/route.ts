import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { NextRequest, NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-wrapper";
import { approveEvent } from "@/lib/dal/events";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;
  
  await approveEvent(session, id);

  return NextResponse.json({ success: true });
});
