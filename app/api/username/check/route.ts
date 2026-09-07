import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { normalizeUsername, usernameError } from "@/lib/username-policy";

export const GET = withApiHandler(async (req: NextRequest) => {
  const candidate = new URL(req.url).searchParams.get("u");
  const message = usernameError(candidate);
  if (message) return NextResponse.json({ available: false, message });
  const normalized = normalizeUsername(candidate!);
  const [taken] = await db.select({ id: user.id }).from(user)
    .where(or(eq(user.usernameLower, normalized), sql`lower(trim(${user.username})) = ${normalized}`)).limit(1);
  // Never return identities, suggestions from accounts, or profile data.
  return NextResponse.json({ available: !taken, message: taken ? "This username is taken. Choose another." : "Available. It will be yours when you save." }, { headers: { "Cache-Control": "no-store" } });
}, { requireAuth: false, rateLimitPrefix: "username-availability" });
