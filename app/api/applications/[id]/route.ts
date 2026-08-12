import { NextResponse } from "next/server";
import { requireLead, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { ApplicationService } from "@/lib/services/applications";

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    
    
  const session = await requireLead();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const updatedApp = await ApplicationService.updateApplicationStatus(id, status);

  return NextResponse.json({ success: true, data: updatedApp });
});
