"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogHeader, TextArea, HStack, VStack, Text } from "@astryxdesign/core";
import { toast } from "sonner";

export function ProcurementActions({ reqId }: { reqId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const router = useRouter();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/procurement`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId, status: "approved" }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Approval failed");
      }
      
      toast.success("Procurement Approved", { description: "The request has been approved." });
      router.refresh();
    } catch (e: any) {
      toast.error("Error", { description: e.message || "Failed to approve request." });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Reason Required", { description: "Please provide a reason for rejection." });
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/procurement`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId, status: "rejected", reason: rejectReason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Rejection failed");
      }
      
      toast.success("Procurement Rejected", { description: "The request has been rejected." });
      setDialogOpen(false);
      router.refresh();
    } catch (e: any) {
      toast.error("Error", { description: e.message || "Failed to reject request." });
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <HStack gap={3}>
      <Button 
        variant="secondary" 
        label="Reject" 
        onClick={() => setDialogOpen(true)}
      />
      <Dialog 
        isOpen={dialogOpen} 
        onOpenChange={(val: boolean) => setDialogOpen(val)}
      >
        <DialogHeader title="Reject Procurement Request" />
        <VStack gap={4} className="py-4">
          <Text type="supporting" className="text-sm">Provide a reason for rejecting this procurement request.</Text>
          <TextArea
            label="Reason for rejection"
            placeholder="e.g. Budget exceeded for this quarter."
            value={rejectReason}
            onChange={(val) => setRejectReason(val)}
            rows={4}
          />
        </VStack>
        <HStack gap={2} justify="end">
          <Button variant="ghost" label="Cancel" onClick={() => setDialogOpen(false)} />
          <Button variant="destructive" label={isRejecting ? "Rejecting..." : "Confirm Rejection"} onClick={handleReject} isDisabled={isRejecting} />
        </HStack>
      </Dialog>
      
      <Button onClick={handleApprove} isDisabled={isApproving} label={isApproving ? "Approving..." : "Approve Request"} />
    </HStack>
  );
}
