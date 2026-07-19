import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";

const RESERVED_HANDLES = ["admin", "root", "api", "www", "events", "forms", "recruitment", "finance", "inventory", "settings", "profile", "dashboard", "u"];
const COOLDOWN_DAYS = 30;
const MAX_CHANGES = 3;

export const PATCH = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();

  const body = await req.json();
  const { username } = body;
  
  if (!username) {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const usernameLower = username.toLowerCase().trim();

  if (!/^[a-z0-9_]{3,20}$/.test(usernameLower)) {
    return NextResponse.json({ error: "Username must be 3-20 characters, lowercase alphanumeric and underscores only." }, { status: 400 });
  }

  if (RESERVED_HANDLES.includes(usernameLower)) {
    return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
  }

  const currentUser = await db.query.user.findFirst({
    where: eq(user.id, session.user.id)
  });

  if (!currentUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (currentUser.usernameLower === usernameLower) {
    return NextResponse.json({ error: "This is already your username" }, { status: 400 });
  }

  // Cooldown check
  if (currentUser.handleChangedAt) {
    const daysSinceChange = (new Date().getTime() - currentUser.handleChangedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceChange < COOLDOWN_DAYS) {
      return NextResponse.json({ 
        error: `You can only change your username every ${COOLDOWN_DAYS} days. Please try again in ${Math.ceil(COOLDOWN_DAYS - daysSinceChange)} days.` 
      }, { status: 403 });
    }
  }

  // Max changes check
  if ((currentUser.handleChangeCount || 0) >= MAX_CHANGES) {
    return NextResponse.json({ error: `You have reached the maximum number of username changes (${MAX_CHANGES}).` }, { status: 403 });
  }

  const existingUser = await db.query.user.findFirst({
    where: eq(user.usernameLower, usernameLower)
  });

  if (existingUser) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
  }

  // Update user
  await db.update(user).set({
    username: username,
    usernameLower: usernameLower,
    handleChangedAt: new Date(),
    handleChangeCount: (currentUser.handleChangeCount || 0) + 1
  }).where(eq(user.id, session.user.id));

  // Create audit log
  await db.insert(auditLogs).values({
    actorId: session.user.id,
    action: "CHANGE_USERNAME",
    entity: "user",
    entityId: session.user.id,
    details: `Changed username from @${currentUser.usernameLower || 'none'} to @${usernameLower}`
  });

  return NextResponse.json({ success: true, username });
});
