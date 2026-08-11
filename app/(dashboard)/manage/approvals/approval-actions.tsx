"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogHeader, TextArea, HStack, VStack, Text } from "@astryxdesign/core";
import { toast } from "sonner";

export function ApprovalActions({ eventId }: { eventId: string }) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const router = useRouter();
  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Approval failed");
      
      toast.success("Event Approved", { description: "The event is now published." });
      router.refresh();
    } catch (e) {
      toast.error("Error", { description: "Failed to approve event." });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Reason Required", { description: "Please provide feedback for rejection." });
      return;
    }

    setIsRejecting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      
      toast.success("Event Rejected", { description: "Feedback has been sent to the creator." });
      setDialogOpen(false);
      router.refresh();
    } catch (e) {
      toast.error("Error", { description: "Failed to reject event." });
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
        <DialogHeader title="Reject Event Draft" />
        <VStack gap={4} className="py-4">
          <Text type="supporting" className="text-sm">Provide constructive feedback so the Lead can revise their draft.</Text>
          <TextArea
            label="Reason for rejection"
            placeholder="e.g. Please update the cover image to meet our brand guidelines."
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
      
      <Button onClick={handleApprove} isDisabled={isApproving} label={isApproving ? "Approving..." : "Approve & Publish"} />
    </HStack>
  );
}
