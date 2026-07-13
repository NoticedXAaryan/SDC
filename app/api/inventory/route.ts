import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { createInventoryItemSchema } from "@/lib/validators/inventory";
import { logAuditEvent } from "@/lib/services/audit";
import crypto from "crypto";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

/**
 * GET /api/inventory
 * Requires lead, co_lead, finance_lead, admin, or owner.
 */
export async function GET() {
  try {
    await requireRole(["lead", "co_lead", "finance_lead", "admin", "owner"]);

    const items = await db.select().from(inventory).orderBy(inventory.name);
    return NextResponse.json(items);
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Inventory GET]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const POST = withApiHandler(async (req: NextRequest) => {
try {
const session = await requireRole(["finance_lead", "admin", "owner"]);
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

await db.insert(inventory).values({
  id: itemId,
  name,
  qtyTotal,
  qtyAvailable: qtyTotal, // Initially, all items are available
});

await logAuditEvent({
  actorId: session.user.id,
  action: "inventory_create",
  entity: "inventory",
  entityId: itemId,
  details: `Added new item ${name} with quantity ${qtyTotal}`,
});

return NextResponse.json({ success: true, id: itemId }, { status: 201 });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Inventory POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
