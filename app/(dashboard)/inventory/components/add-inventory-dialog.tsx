"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogHeader, TextInput, HStack, VStack, Text } from "@astryxdesign/core";
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
        const data = await res.json();
        throw new Error(data.error || "Failed to add inventory item");
      }

      toast.success("Inventory item added successfully");
      setOpen(false);
      setName("");
      setQtyTotal("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="primary" 
        icon={<Plus className="w-4 h-4" />}
        label="Add Item"
        onClick={() => setOpen(true)}
      />
      <Dialog isOpen={open} onOpenChange={(val: boolean) => setOpen(val)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader title="Add Inventory Item" />
          <VStack gap={4} className="py-4">
            <Text type="supporting" className="text-sm">
              Create a new item in the club inventory.
            </Text>
            
            <TextInput 
              id="name" 
              label="Item Name"
              value={name} 
              onChange={val => setName(val)} 
              isRequired
              placeholder="e.g. Arduino Uno" 
            />
            
            <TextInput 
              id="qty" 
              label="Total Quantity"
              value={qtyTotal} 
              onChange={val => setQtyTotal(val)} 
              isRequired
            />
          </VStack>
          <HStack gap={2} justify="end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} isDisabled={loading} label="Cancel" />
            <Button type="submit" isDisabled={loading} label={loading ? "Saving..." : "Add Item"} />
          </HStack>
        </form>
      </Dialog>
    </>
  );
}
