import { NextRequest, NextResponse } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { CommunicationService } from "@/lib/services/communications";
export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireSession();
    
    
  const { id } = await params;
  
  const body = await req.json().catch(() => ({}));
  const result = await CommunicationService.notifyColleagues(session, id, body);
  
  return NextResponse.json(result);
});

