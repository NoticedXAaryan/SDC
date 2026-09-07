import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { changeMemberRole } from "@/lib/dal/members";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";
import { NotificationService } from "@/lib/services/notifications";
import { z } from "zod";
const approval = z.object({ userId: z.string().min(1), approve: z.literal(true) });
export const POST = withApiHandler(async (request: NextRequest) => {
  const session = await requireSession();
  if (!["admin", "owner"].includes(session.user.role)) throw new AuthorizationError("An admin must approve direct membership.");
  const body = approval.parse(await request.json());
  await changeMemberRole(session, { userId: body.userId, role: "member" });
  try {
    await NotificationService.sendInAppNotification({ userId: body.userId, type: "system", title: "Membership approved", message: "Congratulations! You are a member now." });
  } catch (error) { console.error("Membership approved; notification delivery failed", error); }
  return NextResponse.json({ success: true, message: "Membership approved." });
});
