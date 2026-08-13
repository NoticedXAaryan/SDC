import { db } from "@/lib/db";
import { inventory, inventoryLogs, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

export async function logInventoryActionDb(sessionAuth: AuthSession, eventId: string, data: { itemId: string; qty: number; action: string }) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const { itemId, qty, action } = data;

  if (!itemId || !qty || !["check_out", "check_in"].includes(action)) {
    throw new ValidationError("Invalid request payload");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  const item = await db.query.inventory.findFirst({
    where: eq(inventory.id, itemId),
  });

  if (!item) {
    throw new ValidationError("Inventory item not found");
  }

  const requestedQty = Number(qty);

  if (isNaN(requestedQty) || requestedQty <= 0) {
    throw new ValidationError("Quantity must be a positive number");
  }

  if (action === "check_out" && item.qtyAvailable < requestedQty) {
    throw new ValidationError("Insufficient inventory available");
  }

  if (action === "check_in" && item.qtyAvailable + requestedQty > item.qtyTotal) {
    throw new ValidationError("Cannot check in more than total quantity");
  }

  await db.transaction(async (tx) => {
    await tx.insert(inventoryLogs).values({
      id: crypto.randomUUID(),
      itemId,
      userId: sessionAuth.user.id,
      action: action as "check_out" | "check_in",
      qty: requestedQty,
    });

    const newQtyAvailable = action === "check_out" 
      ? item.qtyAvailable - requestedQty 
      : item.qtyAvailable + requestedQty;

    await tx.update(inventory)
      .set({ qtyAvailable: newQtyAvailable })
      .where(eq(inventory.id, itemId));
  });

  return { success: true };
}