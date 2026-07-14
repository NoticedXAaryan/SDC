import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory, inventoryLogs, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/services/audit";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
const session = await requireRole(["lead", "co_lead", "admin", "owner"]);
const { id: eventId } = await params;

const body = await req.json().catch(() => ({}));
const { itemId, qty, action } = body;

if (!itemId || !qty || !["check_out", "check_in"].includes(action)) {
  return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
}

const event = await db.query.events.findFirst({
  where: eq(events.id, eventId),
});

if (!event) {
  return NextResponse.json({ error: "Event not found" }, { status: 404 });
}

const item = await db.query.inventory.findFirst({
  where: eq(inventory.id, itemId),
});

if (!item) {
  return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
}

const requestedQty = Number(qty);

if (action === "check_out" && item.qtyAvailable < requestedQty) {
  return NextResponse.json({ error: "Insufficient inventory available" }, { status: 400 });
}

// Since we need to update atomically, we'll use a transaction
await db.transaction(async (tx) => {
  // Create the log
  await tx.insert(inventoryLogs).values({
    id: crypto.randomUUID(),
    itemId,
    userId: session.user.id,
    action: action as "check_out" | "check_in",
    qty: requestedQty,
  });

  // Update inventory counts
  const newQtyAvailable = action === "check_out" 
    ? item.qtyAvailable - requestedQty 
    : item.qtyAvailable + requestedQty;

  await tx.update(inventory)
    .set({ qtyAvailable: newQtyAvailable })
    .where(eq(inventory.id, itemId));
});

await logAuditEvent({
  actorId: session.user.id,
  action: "event_inventory_allocation",
  entity: "inventory",
  entityId: itemId,
  details: `Action: ${action}, Qty: ${requestedQty}, Event: ${eventId}`,
});

return NextResponse.json({ success: true, message: `Successfully logged inventory ${action}` });

});
