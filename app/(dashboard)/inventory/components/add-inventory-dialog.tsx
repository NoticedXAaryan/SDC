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
import { Plus } from "lucide-react";

export function AddInventoryDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [name, setName] = useState("");
  const [qtyTotal, setQtyTotal] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !qtyTotal) return;

    setLoading(true);
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          qtyTotal: parseInt(qtyTotal, 10),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data.error || "Failed to add inventory item");
      }

      toast.success("Inventory item added successfully");
      setOpen(false);
      setName("");
      setQtyTotal("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Inventory item could not be added");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus aria-hidden="true" /> Add Item
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Create a new item in the club inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" name="name" autoComplete="off" maxLength={120} value={name} onChange={e => setName(e.target.value)} required placeholder="Arduino Uno" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qty">Total Quantity</Label>
              <Input id="qty" name="qtyTotal" type="number" min="1" step="1" inputMode="numeric" autoComplete="off" value={qtyTotal} onChange={e => setQtyTotal(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Add Item"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
