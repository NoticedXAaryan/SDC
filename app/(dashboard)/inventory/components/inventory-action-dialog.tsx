"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogHeader, TextInput, HStack, VStack, Text } from "@astryxdesign/core";
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
    <>
      <Button 
        variant="secondary" 
        onClick={() => {
          setAction("check_out");
          setOpen(true);
        }} 
        isDisabled={item.qtyAvailable === 0}
        icon={<ArrowUpFromLine className="w-3 h-3" />}
        label="Out"
      />
      {/* Invisible trigger for check in that we control via a separate button outside DialogTrigger but sharing same Dialog state? No, we can just use a separate Dialog or conditionally render. Actually it's easier to use a Dropdown or two buttons in the parent that open different dialogs.
          Let's just use two buttons in this component.
      */}
      <Dialog isOpen={open} onOpenChange={(val: boolean) => setOpen(val)}>
        <></>
      </Dialog>
    </>
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
      <HStack gap={2} className="w-full mt-4">
        <Button 
          variant="secondary" 
          onClick={() => openDialog("check_in")} 
          isDisabled={item.qtyAvailable >= item.qtyTotal}
          icon={<ArrowDownToLine className="w-3 h-3" />}
          label="Check In"
          className="flex-1"
        />
        <Button 
          variant="primary" 
          onClick={() => openDialog("check_out")} 
          isDisabled={item.qtyAvailable === 0}
          icon={<ArrowUpFromLine className="w-3 h-3" />}
          label="Check Out"
          className="flex-1"
        />
      </HStack>

      <Dialog isOpen={open} onOpenChange={(val: boolean) => setOpen(val)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader title={`${action === "check_out" ? "Check Out" : "Check In"} ${item.name}`} />
          <VStack gap={4} className="py-4">
            <Text type="supporting" className="text-sm">
              {action === "check_out" 
                ? `Available to check out: ${item.qtyAvailable}` 
                : `Total missing to check in: ${item.qtyTotal - item.qtyAvailable}`}
            </Text>
            
            <TextInput 
              id="qty" 
              label="Quantity"
              value={qty} 
              onChange={val => setQty(val)} 
              isRequired
            />
          </VStack>
          <HStack gap={2} justify="end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} isDisabled={loading} label="Cancel" />
            <Button type="submit" isDisabled={loading} label={loading ? "Saving..." : "Confirm"} />
          </HStack>
        </form>
      </Dialog>
    </>
  );
}
