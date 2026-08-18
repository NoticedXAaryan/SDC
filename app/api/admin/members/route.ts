import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal/auth";
import { changeMemberRole, listMembers } from "@/lib/dal/members";
import { memberSearchSchema, roleChangeSchema } from "@/lib/validators/member";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireAdmin();
  const url = new URL(req.url);
  const params = memberSearchSchema.parse({
    page: url.searchParams.get("page") || undefined,
    limit: url.searchParams.get("limit") || undefined,
    search: url.searchParams.get("search") || undefined,
    role: url.searchParams.get("role") || undefined,
    year: url.searchParams.get("year") || undefined,
    sortBy: url.searchParams.get("sortBy") || undefined,
    sortOrder: url.searchParams.get("sortOrder") || undefined,
  });

  return NextResponse.json(await listMembers(session, params));
}, { requireRateLimit: false });

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const session = await requireAdmin();
  const input = roleChangeSchema.parse(await req.json());
  const result = await changeMemberRole(session, input);

  return NextResponse.json({
    success: true,
    message: `${result.member.name}'s role was updated to ${result.newRole}.`,
    ...result,
  });
});
