import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/dal/auth";
import {
  applyMemberLifecycleAction,
  deleteMemberAccount,
} from "@/lib/dal/members";
import {
  memberDeleteSchema,
  memberLifecycleSchema,
} from "@/lib/validators/member";
import { withApiHandler } from "@/lib/api-wrapper";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: RouteContext,
) => {
  const session = await requireAdmin();
  const { id } = await params;
  const input = memberLifecycleSchema.parse(await req.json());
  const result = await applyMemberLifecycleAction(session, id, input);
  return NextResponse.json({ success: true, ...result });
});

export const DELETE = withApiHandler(async (
  req: NextRequest,
  { params }: RouteContext,
) => {
  const session = await requireAdmin();
  const { id } = await params;
  const input = memberDeleteSchema.parse(await req.json());
  const result = await deleteMemberAccount(session, id, input);
  return NextResponse.json(result);
});
