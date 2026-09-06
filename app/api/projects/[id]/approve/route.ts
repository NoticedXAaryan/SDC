import { NextRequest, NextResponse } from "next/server";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { PROJECT_REVIEW_ROLES } from "@/lib/domain/projects";
import { reviewProject } from "@/lib/services/projects";
import { reviewProjectSchema } from "@/lib/validators/projects";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    
    
const session = await requireRole([...PROJECT_REVIEW_ROLES]);
await checkEmergencyFreeze(session.user.role as string);

const { id: projectId } = await params;
const parsed = reviewProjectSchema.safeParse(await req.json().catch(() => ({})));
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid review", details: parsed.error.flatten() }, { status: 400 });
}
const updated = await reviewProject(session, projectId, parsed.data);

return NextResponse.json({ success: true, project: updated });

});
