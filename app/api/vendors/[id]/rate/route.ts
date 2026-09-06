import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auditLogs, vendorRatings, vendors } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";
import { VENDOR_MANAGER_ROLES } from "@/lib/dal/procurement";
import { nanoid } from "nanoid";

const rateSchema = z.object({
  rating: z.number().int().min(1).max(5),
  notes: z.string().trim().max(1000).optional(),
});

export const dynamic = "force-dynamic";

export const PATCH = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    
    
const session = await requireRole([...VENDOR_MANAGER_ROLES]);

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

const averageRating = await db.transaction(async (tx) => {
  await tx.insert(vendorRatings).values({
    id: nanoid(),
    vendorId: id,
    ratedBy: session.user.id,
    rating,
    notes: notes || null,
  });
  const [aggregate] = await tx.select({ value: sql<number>`avg(${vendorRatings.rating})` })
    .from(vendorRatings)
    .where(eq(vendorRatings.vendorId, id));
  const average = Math.round(Number(aggregate?.value ?? rating));
  await tx.update(vendors).set({ rating: average, updatedAt: new Date() }).where(eq(vendors.id, id));
  await tx.insert(auditLogs).values({
    id: nanoid(), actorId: session.user.id, action: "vendor_rated", entity: "vendor", entityId: id,
    details: JSON.stringify({ rating, averageRating: average, hasNotes: Boolean(notes) }), timestamp: new Date(),
  });
  return average;
});

return NextResponse.json({ success: true, message: "Vendor rated successfully", averageRating });

});
