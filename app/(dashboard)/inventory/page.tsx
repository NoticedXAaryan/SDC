import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";

export default async function InventoryPage() {
  await requireSession();

  const items = await db.select().from(inventory).orderBy(desc(inventory.createdAt));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Inventory & Equipment" 
        description="View available club equipment and hardware." 
      />

      {items.length === 0 ? (
        <EmptyState
          title="No inventory"
          description="There are currently no items in the inventory."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  );
}