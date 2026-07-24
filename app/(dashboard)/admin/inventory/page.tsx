import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory, inventoryLogs, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";

export default async function AdminInventoryPage() {
  await requireRole(["admin", "owner", "tech_lead", "lead"]);

  const items = await db.select().from(inventory).orderBy(desc(inventory.createdAt));
  
  const recentLogs = await db.select({
    log: inventoryLogs,
    user: { name: user.name },
    item: { name: inventory.name }
  })
  .from(inventoryLogs)
  .leftJoin(user, eq(inventoryLogs.userId, user.id))
  .leftJoin(inventory, eq(inventoryLogs.itemId, inventory.id))
  .orderBy(desc(inventoryLogs.timestamp))
  .limit(10);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Manage Inventory" 
        description="Add, edit, or remove club equipment and track inventory logs." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <VStack gap={4} className="lg:col-span-2">
          <Text weight="bold" className="text-2xl">Equipment List</Text>
          {items.length === 0 ? (
            <EmptyState
              title="No inventory"
              description="There are currently no items in the inventory."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map(item => (
                <Card key={item.id}>
                  <VStack gap={4}>
                    <VStack gap={1}>
                      <Text weight="semibold" className="text-lg">{item.name}</Text>
                      <HStack gap={2} align="center">
                        <Badge 
                          variant={item.qtyAvailable > 0 ? "success" : "error"}
                          label={item.qtyAvailable > 0 ? "In Stock" : "Out of Stock"}
                        />
                        <Text type="supporting" className="text-sm">
                          {item.qtyAvailable} / {item.qtyTotal} available
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </Card>
              ))}
            </div>
          )}
        </VStack>

        <VStack gap={4}>
          <Text weight="bold" className="text-2xl">Recent Logs</Text>
          {recentLogs.length === 0 ? (
            <EmptyState
              title="No activity"
              description="No recent inventory logs."
            />
          ) : (
            <VStack gap={3}>
              {recentLogs.map(({ log, user, item }) => (
                <Card key={log.id}>
                  <VStack gap={1}>
                    <HStack justify="between" align="start">
                      <Text weight="semibold" className="text-sm">{item?.name || "Unknown Item"}</Text>
                      <Badge 
                        variant={log.action === "check_in" ? "success" : "warning"}
                        label={log.action.replace("_", " ")}
                      />
                    </HStack>
                    <Text type="supporting" className="text-xs">
                      {user?.name || "Unknown User"} • Qty: {log.qty}
                    </Text>
                    <Text type="supporting" className="text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </Text>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </div>
    </div>
  );
}