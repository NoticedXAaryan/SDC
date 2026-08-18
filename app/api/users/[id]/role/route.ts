import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal/auth";
import { changeMemberRole } from "@/lib/dal/members";
import { roleChangeSchema } from "@/lib/validators/member";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await requireAdmin();
  const { id } = await params;
  const body = await req.json();
  const input = roleChangeSchema.parse({ userId: id, role: body.role });
  const result = await changeMemberRole(session, input);
  return NextResponse.json({ success: true, role: result.newRole });
});
