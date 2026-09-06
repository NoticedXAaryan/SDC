import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory, inventoryLogs, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { InventoryItemCard } from "./inventory-client";
import { AddInventoryDialog } from "./components/add-inventory-dialog";
import { INVENTORY_ACTION_ROLES, INVENTORY_CREATE_ROLES } from "@/lib/domain/inventory";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function InventoryPage() {
  const session = await requireSession();
  const userRole = session.user.role as string;
  const canMoveStock = (INVENTORY_ACTION_ROLES as readonly string[]).includes(userRole);
  const canCreateItems = (INVENTORY_CREATE_ROLES as readonly string[]).includes(userRole);

  const items = await db.select().from(inventory).orderBy(desc(inventory.createdAt));
  const recentLogs = canMoveStock ? await db.select({
    log: inventoryLogs,
    userName: user.name,
    itemName: inventory.name,
  })
    .from(inventoryLogs)
    .leftJoin(user, eq(inventoryLogs.userId, user.id))
    .leftJoin(inventory, eq(inventoryLogs.itemId, inventory.id))
    .orderBy(desc(inventoryLogs.timestamp))
    .limit(10) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Inventory & Equipment" 
        description="Track available equipment, stock movements, and recent custody activity."
        primaryAction={canCreateItems ? <AddInventoryDialog /> : undefined}
      />

      {items.length === 0 ? (
        <EmptyState
          title="No inventory"
          description="There are currently no items in the inventory."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map(item => (
            <InventoryItemCard key={item.id} item={item} canMoveStock={canMoveStock} />
          ))}
        </div>
      )}

      {canMoveStock ? (
        <section aria-labelledby="inventory-activity-heading" className="space-y-4">
          <h2 id="inventory-activity-heading" className="text-xl font-semibold">Recent Stock Activity</h2>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No stock movements have been recorded.</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {recentLogs.map(({ log, userName, itemName }) => (
                <Card key={log.id}>
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium">{itemName || "Unknown item"}</p>
                      <p className="text-sm text-muted-foreground">{userName || "Unknown user"} · {new Date(log.timestamp).toLocaleString()}</p>
                    </div>
                    <Badge variant={log.action === "check_in" ? "default" : "secondary"}>{log.action === "check_in" ? "Checked in" : "Checked out"} · {log.qty}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
