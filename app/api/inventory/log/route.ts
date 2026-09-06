import { NextRequest, NextResponse } from "next/server";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, inventory, inventoryLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logInventoryActionSchema } from "@/lib/validators/inventory";
import { withApiHandler, ValidationError } from "@/lib/api-wrapper";
import crypto from "crypto";
import { INVENTORY_ACTION_ROLES } from "@/lib/domain/inventory";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const session = await requireRole([...INVENTORY_ACTION_ROLES]);
await checkEmergencyFreeze(session.user.role as string);
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
  const [item] = await tx.select().from(inventory).where(eq(inventory.id, itemId)).limit(1).for("update");
  if (!item) {
    throw new ValidationError("Inventory item not found");
  }

  let newQtyAvailable = item.qtyAvailable;

  if (action === "check_out") {
    if (item.qtyAvailable < qty) {
      throw new ValidationError("Insufficient available quantity");
    }
    newQtyAvailable -= qty;
  } else if (action === "check_in") {
    if (item.qtyAvailable + qty > item.qtyTotal) {
      throw new ValidationError("Cannot check in more than total quantity");
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

  await tx.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorId: session.user.id,
    action: action === "check_in" ? "inventory_checkin" : "inventory_checkout",
    entity: "inventory",
    entityId: itemId,
    details: JSON.stringify({ itemName: item.name, qty, resultingAvailable: newQtyAvailable }),
    timestamp: new Date(),
  });

  return { logId, newQtyAvailable };
});

return NextResponse.json({ success: true, logId: result.logId, qtyAvailable: result.newQtyAvailable }, { status: 201 });

});
