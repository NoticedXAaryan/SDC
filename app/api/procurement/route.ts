import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { procurementRequests, vendors, user, expenses } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const procurementSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  eventId: z.string().optional(),
  estimatedCost: z.number().int().min(0).optional(),
});

const procurementReviewSchema = z.object({
  status: z.enum(["draft", "pending_quotes", "approval", "approved", "rejected", "completed"]),
  selectedVendorId: z.string().optional(),
  quotesUrl: z.string().url().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await db.select({
      id: procurementRequests.id,
      title: procurementRequests.title,
      description: procurementRequests.description,
      status: procurementRequests.status,
      estimatedCost: procurementRequests.estimatedCost,
      quotesUrl: procurementRequests.quotesUrl,
      requesterName: user.name,
      vendorName: vendors.name,
    })
    .from(procurementRequests)
    .innerJoin(user, eq(user.id, procurementRequests.requestedBy))
    .leftJoin(vendors, eq(vendors.id, procurementRequests.selectedVendorId))
    .orderBy(desc(procurementRequests.createdAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("[Procurement GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withApiHandler(async (req: NextRequest) => {
try {
const sessionAuth = await requireRole(["event_lead", "lead", "vice_lead", "finance_lead", "admin", "owner"]);

const body = await req.json();
const parsed = procurementSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { title, description, eventId, estimatedCost } = parsed.data;

const [newRequest] = await db.insert(procurementRequests).values({
  id: nanoid(),
  title,
  description,
  eventId: eventId || null,
  estimatedCost: estimatedCost || null,
  requestedBy: sessionAuth.user.id,
  status: "draft",
  createdAt: new Date(),
  updatedAt: new Date(),
}).returning();

return NextResponse.json(newRequest, { status: 201 });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Procurement POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});

export const PATCH = withApiHandler(async (req: NextRequest) => {
try {
const sessionAuth = await requireRole(["finance_lead", "lead", "vice_lead", "admin", "owner"]);

const body = await req.json();
const { id, ...updateData } = body;

const parsed = procurementReviewSchema.safeParse(updateData);
if (!parsed.success || !id) {
  return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
}

const [existing] = await db.select().from(procurementRequests).where(eq(procurementRequests.id, id)).limit(1);
if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

await db.transaction(async (tx) => {
  // 1. Update procurement
  await tx.update(procurementRequests).set({
    status: parsed.data.status,
    selectedVendorId: parsed.data.selectedVendorId || existing.selectedVendorId,
    quotesUrl: parsed.data.quotesUrl || existing.quotesUrl,
    updatedAt: new Date(),
  }).where(eq(procurementRequests.id, id));

  // 2. Finance sync (P5-04)
  if (parsed.data.status === "approved" && existing.status !== "approved" && existing.estimatedCost) {
    /*
    const txId = nanoid();
    await tx.insert(expenses).values({
      amount: String(existing.estimatedCost),
      description: `Procurement: ${existing.title}`,
      date: new Date(),
      category: "procurement",
      requestedBy: sessionAuth.user.id,
      eventId: existing.eventId,
      receiptUrl: parsed.data.quotesUrl || existing.quotesUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    */

    /*
    // Link back to procurement
    await tx.update(procurementRequests).set({
      financeTransactionId: txId
    }).where(eq(procurementRequests.id, id));
    */
  }
});

return NextResponse.json({ success: true, message: `Procurement updated to ${parsed.data.status}` });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Procurement PATCH]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
