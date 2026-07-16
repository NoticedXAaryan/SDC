import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, auditLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";

const RESERVED_HANDLES = ["admin", "root", "api", "www", "events", "forms", "recruitment", "finance", "inventory", "settings", "profile", "dashboard", "u"];

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { username } = body;
    
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const usernameLower = username.toLowerCase().trim();

    // Regex check: lowercase alphanumeric + underscore, 3-20 chars, no spaces
    if (!/^[a-z0-9_]{3,20}$/.test(usernameLower)) {
      return NextResponse.json({ error: "Username must be 3-20 characters, lowercase alphanumeric and underscores only." }, { status: 400 });
    }

    if (RESERVED_HANDLES.includes(usernameLower)) {
      return NextResponse.json({ error: "This username is reserved." }, { status: 400 });
    }

    // Check if the current user already has a username
    const currentUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id)
    });

    if (currentUser?.username) {
      return NextResponse.json({ error: "Username is already set. Use the update endpoint to change it." }, { status: 400 });
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
      displayName: session.user.name || username,
      handleChangedAt: new Date(),
    }).where(eq(user.id, session.user.id));

    // Create audit log
    await db.insert(auditLogs).values({
      actorId: session.user.id,
      action: "RESERVE_USERNAME",
      entity: "user",
      entityId: session.user.id,
      details: `Reserved username @${usernameLower}`
    });

    return NextResponse.json({ success: true, username });

  } catch (error) {
    console.error("Error reserving username:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
