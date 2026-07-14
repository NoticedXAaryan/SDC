import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user, registrations } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { nanoid } from "nanoid";
import Papa from "papaparse";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireRole(["admin", "owner", "lead", "event_lead", "co_lead"]);
await checkEmergencyFreeze(session.user.role as string);
const { id: eventId } = await params;

const formData = await req.formData();
const file = formData.get("file") as File;
if (!file) {
  return NextResponse.json({ error: "No file provided" }, { status: 400 });
}

const text = await file.text();
const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });

if (parsed.errors.length > 0) {
  return NextResponse.json({ error: "Failed to parse CSV", details: parsed.errors }, { status: 400 });
}

const rows = parsed.data as Array<{ name?: string, email?: string, status?: string }>;

const validRows = rows.filter(r => r.email); // Need at least email

if (validRows.length === 0) {
  return NextResponse.json({ error: "No valid rows with 'email' column found" }, { status: 400 });
}

const result = await db.transaction(async (tx) => {
  let importedCount = 0;
  
  // We process sequentially to avoid huge parallel load, or we could batch it.
  // Sequential is fine for small/medium CSVs.
  for (const row of validRows) {
    const email = row.email?.trim().toLowerCase();
    const name = row.name?.trim() || "Unknown";
    const status = (row.status?.trim().toLowerCase() || "confirmed") as "confirmed" | "waitlist" | "checked_in" | "cancelled" | "no_show";
    
    if (!email) continue;

    // 1. Find or create user
    let [existingUser] = await tx.select().from(user).where(eq(user.email, email)).limit(1);
    
    if (!existingUser) {
      const newUserId = nanoid();
      [existingUser] = await tx.insert(user).values({
        id: newUserId,
        name,
        email,
        emailVerified: false,
        role: "member",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    }

    // 2. Check if already registered
    const [existingReg] = await tx.select().from(registrations).where(
      and(
        eq(registrations.eventId, eventId),
        eq(registrations.userId, existingUser.id)
      )
    ).limit(1);

    if (!existingReg) {
      await tx.insert(registrations).values({
        id: nanoid(),
        eventId,
        userId: existingUser.id,
        passCode: nanoid(10),
        status: ["confirmed", "waitlist", "checked_in", "cancelled", "no_show"].includes(status) ? status : "confirmed",
        createdAt: new Date(),
      });
      importedCount++;
    }
  }
  return { importedCount };
});

return NextResponse.json({ success: true, imported: result.importedCount, total: validRows.length });

});
