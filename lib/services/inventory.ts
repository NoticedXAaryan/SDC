import { logInventoryActionDb } from "@/lib/dal/inventory";
import { logAuditEvent } from "@/lib/services/audit";
import type { AuthSession } from "@/lib/dal/auth";

export class InventoryService {
  static async logInventoryAction(sessionAuth: AuthSession, eventId: string, data: { itemId: string; qty: number; action: string }) {
    await logInventoryActionDb(sessionAuth, eventId, data);
    
    // Dispatch side-effect
    await logAuditEvent({
      actorId: sessionAuth.user.id,
      action: "event_inventory_allocation",
      entity: "inventory",
      entityId: data.itemId,
      details: `Action: ${data.action}, Qty: ${data.qty}, Event: ${eventId}`,
    });

    return { success: true, message: `Successfully logged inventory ${data.action}` };
  }
}
