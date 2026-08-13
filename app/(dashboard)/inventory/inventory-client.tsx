"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function InventoryItemCard({ item, isLead }: { item: any; isLead: boolean }) {
  const [qtyAvailable, setQtyAvailable] = useState(item.qtyAvailable);
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "check_in" | "check_out") => {
    const num = parseInt(qty, 10);
    if (!num || num <= 0) return toast.error("Enter a valid quantity");
    
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, action, qty: num }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || "Failed to update inventory");
      
      setQtyAvailable(data.qtyAvailable);
      setQty("");
      toast.success(`Successfully ${action === "check_in" ? "checked in" : "checked out"} ${num} items`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 flex flex-col gap-4">
      <div>
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant={qtyAvailable > 0 ? "default" : "destructive"}>
            {qtyAvailable > 0 ? "In Stock" : "Out of Stock"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {qtyAvailable} / {item.qtyTotal} available
          </span>
        </div>
      </div>
      
      {isLead && (
        <div className="flex gap-2 items-center mt-auto pt-4 border-t">
          <Input 
            type="number" 
            min="1" 
            placeholder="Qty" 
            value={qty} 
            onChange={e => setQty(e.target.value)}
            className="w-20"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAction("check_out")}
            disabled={loading || qtyAvailable <= 0}
          >
            Check Out
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleAction("check_in")}
            disabled={loading || qtyAvailable >= item.qtyTotal}
          >
            Check In
          </Button>
        </div>
      )}
    </Card>
  );
}
