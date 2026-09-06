import { NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { RECRUITMENT_REVIEWER_ROLES, updateApplicationStatus } from "@/lib/services/applications";

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    const session = await requireRole(RECRUITMENT_REVIEWER_ROLES);
    const result = await updateApplicationStatus(session, resolvedParams.id, await req.json());
    return NextResponse.json(result);
});
