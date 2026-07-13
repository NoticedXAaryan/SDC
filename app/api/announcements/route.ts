import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
try {
// Only leads and admins can broadcast announcements
await requireRole(["lead", "admin", "owner"]);

const reqBody = await req.json().catch(() => ({}));
const { title, message, link } = reqBody;

if (!title || !message) {
  return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
}

const { user } = await import("@/lib/db/schema");
const { ne } = await import("drizzle-orm");

// Find all users who are members (not outsiders)
const allMembers = await db.select({ id: user.id })
  .from(user)
  .where(ne(user.role, "outsider"));
  
const notifsToInsert = allMembers.map(m => ({
  id: crypto.randomUUID(),
  userId: m.id,
  type: "announcement",
  title,
  message,
  link: link || null
}));

// Batch insert notifications
if (notifsToInsert.length > 0) {
  const chunkSize = 100;
  for (let i = 0; i < notifsToInsert.length; i += chunkSize) {
    const chunk = notifsToInsert.slice(i, i + chunkSize);
    await db.insert(notifications).values(chunk);
  }
}

return NextResponse.json({ 
  success: true, 
  message: `Broadcasted announcement to ${notifsToInsert.length} members` 
}, { status: 201 });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Announcements POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
