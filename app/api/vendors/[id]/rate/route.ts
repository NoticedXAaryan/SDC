import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
await requireRole(["admin", "owner", "finance_lead", "event_lead", "lead", "vice_lead"]);

const body = await req.json();
const parsed = rateSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { id } = await params;
const { rating, notes } = parsed.data;

const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id)).limit(1);
if (!vendor) {
  return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
}

// In a real app, you might want to store multiple ratings and average them.
// For now, we just update the vendor's rating and append to notes.
const newNotes = vendor.notes ? `${vendor.notes}\n[Rating ${rating}/5]: ${notes || 'No comments'}` : `[Rating ${rating}/5]: ${notes || 'No comments'}`;

await db.update(vendors).set({
  rating,
  notes: newNotes,
  updatedAt: new Date(),
}).where(eq(vendors.id, id));

return NextResponse.json({ success: true, message: "Vendor rated successfully" });

});
