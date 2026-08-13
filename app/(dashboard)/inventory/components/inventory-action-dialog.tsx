"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export function InventoryActionDialog({ 
  item 
}: { 
  item: { id: string; name: string; qtyTotal: number; qtyAvailable: number } 
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"check_out" | "check_in">("check_out");
  const [qty, setQty] = useState("1");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty) return;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          action,
          qty: parseInt(qty, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to perform action");
      }

      toast.success(`Successfully ${action === "check_out" ? "checked out" : "checked in"} item`);
      setOpen(false);
      setQty("1");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button variant="outline" size="sm" onClick={() => setAction("check_out")} disabled={item.qtyAvailable === 0}>
          <ArrowUpFromLine className="w-3 h-3 mr-1" /> Out
        </Button>
      </DialogTrigger>
      
      {/* Invisible trigger for check in that we control via a separate button outside DialogTrigger but sharing same Dialog state? No, we can just use a separate Dialog or conditionally render. Actually it's easier to use a Dropdown or two buttons in the parent that open different dialogs.
          Let's just use two buttons in this component.
      */}
    </Dialog>
  );
}

export function InventoryActions({ item }: { item: { id: string; name: string; qtyTotal: number; qtyAvailable: number } }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"check_out" | "check_in">("check_out");
  const [qty, setQty] = useState("1");
  const router = useRouter();

  const openDialog = (a: "check_out" | "check_in") => {
    setAction(a);
    setQty("1");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty) return;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          action,
          qty: parseInt(qty, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to perform action");
      }

      toast.success(`Successfully ${action === "check_out" ? "checked out" : "checked in"} item`);
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2 w-full mt-4">
        <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => openDialog("check_in")} disabled={item.qtyAvailable >= item.qtyTotal}>
          <ArrowDownToLine className="w-3 h-3 mr-1" /> Check In
        </Button>
        <Button variant="default" className="flex-1 text-xs h-8" onClick={() => openDialog("check_out")} disabled={item.qtyAvailable === 0}>
          <ArrowUpFromLine className="w-3 h-3 mr-1" /> Check Out
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{action === "check_out" ? "Check Out" : "Check In"} {item.name}</DialogTitle>
              <DialogDescription>
                {action === "check_out" 
                  ? `Available to check out: ${item.qtyAvailable}` 
                  : `Total missing to check in: ${item.qtyTotal - item.qtyAvailable}`}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="qty">Quantity</Label>
                <Input 
                  id="qty" 
                  type="number" 
                  min="1" 
                  max={action === "check_out" ? item.qtyAvailable : (item.qtyTotal - item.qtyAvailable)} 
                  value={qty} 
                  onChange={e => setQty(e.target.value)} 
                  required 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Confirm"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
