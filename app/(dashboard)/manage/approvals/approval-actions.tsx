"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex space-x-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" />}>
          Reject
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event Draft</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Provide constructive feedback so the Lead can revise their draft.</p>
            <Textarea
              placeholder="e.g. Please update the cover image to meet our brand guidelines."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Button onClick={handleApprove} disabled={isApproving}>
        {isApproving ? "Approving..." : "Approve & Publish"}
      </Button>
    </div>
  );
}
