import { NextRequest, NextResponse } from "next/server";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, inventory } from "@/lib/db/schema";
import { createInventoryItemSchema } from "@/lib/validators/inventory";
import crypto from "crypto";
import { withApiHandler } from "@/lib/api-wrapper";
import { INVENTORY_ACTION_ROLES, INVENTORY_CREATE_ROLES } from "@/lib/domain/inventory";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory
 * Requires lead, co_lead, finance_lead, admin, or owner.
 */
export const GET = withApiHandler(async () => {
  await requireRole([...INVENTORY_ACTION_ROLES]);
  const items = await db.select().from(inventory).orderBy(inventory.name);
  return NextResponse.json(items);
}, { requireRateLimit: false });

export const POST = withApiHandler(async (req: NextRequest) => {
    
    
const session = await requireRole([...INVENTORY_CREATE_ROLES]);
await checkEmergencyFreeze(session.user.role as string);
const body = await req.json();
const parsed = createInventoryItemSchema.safeParse(body);

if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid inventory data", details: parsed.error.flatten() },
    { status: 400 }
  );
}

const { name, qtyTotal } = parsed.data;
const itemId = crypto.randomUUID();

await db.transaction(async (tx) => {
  await tx.insert(inventory).values({
    id: itemId,
    name,
    qtyTotal,
    qtyAvailable: qtyTotal,
  });
  await tx.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorId: session.user.id,
    action: "inventory_create",
    entity: "inventory",
    entityId: itemId,
    details: JSON.stringify({ name, qtyTotal }),
    timestamp: new Date(),
  });
});

return NextResponse.json({ success: true, id: itemId }, { status: 201 });

});
