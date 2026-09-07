import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { saveUsername } from "@/lib/services/usernames";
export const PATCH = withApiHandler(async (req: NextRequest) => {
  const { user } = await requireSession();
  const username = await saveUsername(user.id, (await req.json()).username);
  return NextResponse.json({ success: true, username });
});
