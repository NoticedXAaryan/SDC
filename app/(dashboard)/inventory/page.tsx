import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { InventoryItemCard } from "./inventory-client";

export default async function InventoryPage() {
  const session = await requireSession();
  const userRole = session.user.role as string;
  const isLead = ["lead", "co_lead", "finance_lead", "admin", "owner"].includes(userRole);

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
            <InventoryItemCard key={item.id} item={item} isLead={isLead} />
          ))}
        </div>
      )}
    </div>
  );
}
