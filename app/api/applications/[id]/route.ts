import { NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { RECRUITMENT_REVIEWER_ROLES, updateApplicationStatus } from "@/lib/services/applications";

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const session = await requireRole(RECRUITMENT_REVIEWER_ROLES);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  if (!status) {
    return NextResponse.json({ error: "Status is required" }, { status: 400 });
  }

  const updatedApp = await updateApplicationStatus(session, id, body);

  return NextResponse.json({ success: true, data: updatedApp });
});
