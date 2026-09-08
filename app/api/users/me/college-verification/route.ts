import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";
import { collegeStatus, sendCollegeCode, verifyCollegeCode } from "@/lib/services/college-verification";
export const GET = withApiHandler(async () => {
  const session = await requireSession();
  return NextResponse.json(await collegeStatus(session.user.id), { headers: { "Cache-Control": "no-store" } });
});
export const POST = withApiHandler(async request => {
  const session = await requireSession();
  const body = await request.json();
  if (body.action === "send") await sendCollegeCode(session.user.id, body);
  else if (body.action === "verify") await verifyCollegeCode(session.user.id, body.code);
  else throw new ValidationError("Choose whether to send or verify a code.");
  return NextResponse.json(await collegeStatus(session.user.id), { headers: { "Cache-Control": "no-store" } });
}, { rateLimitPrefix: "college-verification" });
