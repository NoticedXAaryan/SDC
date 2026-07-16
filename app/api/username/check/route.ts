import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";

const RESERVED_HANDLES = ["admin", "root", "api", "www", "events", "forms", "recruitment", "finance", "inventory", "settings", "profile", "dashboard", "u"];

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const u = searchParams.get("u");
    
    if (!u) {
      return NextResponse.json({ error: "Username query parameter 'u' is required" }, { status: 400 });
    }

    const usernameLower = u.toLowerCase().trim();

    // Regex check: lowercase alphanumeric + underscore, 3-20 chars, no spaces
    if (!/^[a-z0-9_]{3,20}$/.test(usernameLower)) {
      return NextResponse.json({ 
        available: false, 
        message: "Username must be 3-20 characters, lowercase alphanumeric and underscores only."
      });
    }

    if (RESERVED_HANDLES.includes(usernameLower)) {
      return NextResponse.json({ 
        available: false, 
        message: "This username is reserved."
      });
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.usernameLower, usernameLower)
    });

    if (existingUser) {
      const suggestions = [
        `${usernameLower}_1`,
        `${usernameLower}_${new Date().getFullYear()}`,
        `${usernameLower}_${Math.floor(Math.random() * 1000)}`
      ];
      return NextResponse.json({ 
        available: false, 
        suggestions 
      });
    }

    return NextResponse.json({ available: true });

  } catch (error) {
    console.error("Error checking username:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
