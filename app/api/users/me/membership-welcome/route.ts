import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";
import { isClubMember } from "@/lib/membership";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";
export const POST = withApiHandler(async () => {
  const session = await requireSession();
  const [account] = await db.select({ role: user.role }).from(user).where(eq(user.id, session.user.id));
  if (!account || !isClubMember(account.role)) throw new AuthorizationError("Membership approval is required.");
  await db.update(user).set({ membershipWelcomeSeen: true }).where(eq(user.id, session.user.id));
  return NextResponse.json({ success: true });
});
