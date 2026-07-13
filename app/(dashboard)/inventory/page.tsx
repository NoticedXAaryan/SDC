import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { inventory, inventoryLogs } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddInventoryDialog } from "./components/add-inventory-dialog";
import { InventoryActions } from "./components/inventory-action-dialog";

export default async function InventoryDashboardPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const items = await db.select().from(inventory);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <AddInventoryDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <CardDescription>Total: {item.qtyTotal}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Available</span>
                <Badge variant={item.qtyAvailable > 0 ? "default" : "destructive"}>
                  {item.qtyAvailable}
                </Badge>
              </div>
              <InventoryActions item={item} />
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full p-8 text-center border rounded-lg text-muted-foreground border-dashed">
            Inventory is empty.
          </div>
        )}
      </div>
    </div>
  );
}
