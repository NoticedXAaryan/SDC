import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory, inventoryLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logInventoryActionSchema } from "@/lib/validators/inventory";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireRole(["lead", "co_lead", "finance_lead", "admin", "owner"]);
const body = await req.json();
const parsed = logInventoryActionSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid inventory log data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { itemId, action, qty } = parsed.data;

// Run within a transaction to ensure atomicity
const result = await db.transaction(async (tx) => {
  const [item] = await tx.select().from(inventory).where(eq(inventory.id, itemId)).limit(1);
  if (!item) {
    throw new Error("Item not found");
  }

  let newQtyAvailable = item.qtyAvailable;

  if (action === "check_out") {
    if (item.qtyAvailable < qty) {
      throw new Error("Insufficient available quantity");
    }
    newQtyAvailable -= qty;
  } else if (action === "check_in") {
    if (item.qtyAvailable + qty > item.qtyTotal) {
      throw new Error("Cannot check in more than total quantity");
    }
    newQtyAvailable += qty;
  }

  // Update available quantity
  await tx.update(inventory)
    .set({ qtyAvailable: newQtyAvailable })
    .where(eq(inventory.id, itemId));

  const logId = crypto.randomUUID();

  // Log the action
  await tx.insert(inventoryLogs).values({
    id: logId,
    itemId,
    userId: session.user.id,
    action,
    qty,
  });

  return { logId, newQtyAvailable, itemName: item.name };
});

await logAuditEvent({
  actorId: session.user.id,
  action: action === "check_in" ? "inventory_checkin" : "inventory_checkout",
  entity: "inventory",
  entityId: itemId,
  details: `${action === "check_in" ? "Checked in" : "Checked out"} ${qty}x ${result.itemName}`,
});

return NextResponse.json({ success: true, logId: result.logId, qtyAvailable: result.newQtyAvailable }, { status: 201 });

});
