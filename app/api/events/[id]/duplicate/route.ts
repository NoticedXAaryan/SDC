import { NextRequest, NextResponse } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { duplicateEvent } from "@/lib/dal/events";
export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;
  
  const event = await duplicateEvent(session, id);
  return NextResponse.json({ event });
});

