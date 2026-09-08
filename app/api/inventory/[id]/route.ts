import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { updateInventoryItemSchema } from "@/lib/validators/inventory";
import { logAuditEvent } from "@/lib/services/audit";

const MANAGER_ROLES = ["finance_lead", "admin", "owner"] as const;

export const PATCH = withApiHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await requireRole([...MANAGER_ROLES]);
  const { id } = await params;
  const parsed = updateInventoryItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid inventory data", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(inventory).where(eq(inventory.id, id)).limit(1).for("update");
    if (!current) return { status: 404, error: "Inventory item not found" } as const;

    const checkedOut = current.qtyTotal - current.qtyAvailable;
    if (parsed.data.qtyTotal < checkedOut) {
      return { status: 409, error: `Quantity cannot be lower than ${checkedOut} while items are checked out` } as const;
    }

    const [item] = await tx.update(inventory).set({
      name: parsed.data.name,
      qtyTotal: parsed.data.qtyTotal,
      qtyAvailable: parsed.data.qtyTotal - checkedOut,
    }).where(eq(inventory.id, id)).returning();
    return { item } as const;
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  await logAuditEvent({
    actorId: session.user.id,
    action: "inventory_update",
    entity: "inventory",
    entityId: id,
    details: `Updated ${result.item.name} inventory quantity to ${result.item.qtyTotal}`,
  });
  return NextResponse.json({ item: result.item });
});

export const DELETE = withApiHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await requireRole([...MANAGER_ROLES]);
  const { id } = await params;
  const result = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(inventory).where(eq(inventory.id, id)).limit(1).for("update");
    if (!current) return { status: 404, error: "Inventory item not found" } as const;
    if (current.qtyAvailable !== current.qtyTotal) {
      return { status: 409, error: "Check in all outstanding items before deleting this inventory record" } as const;
    }
    await tx.delete(inventory).where(eq(inventory.id, id));
    return { item: current } as const;
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
  await logAuditEvent({
    actorId: session.user.id,
    action: "inventory_delete",
    entity: "inventory",
    entityId: id,
    details: `Deleted inventory item ${result.item.name}`,
  });
  return NextResponse.json({ success: true });
});
