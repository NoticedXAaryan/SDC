"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="flex space-x-3">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
            Reject
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Procurement Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">Provide a reason for rejecting this procurement request.</p>
            <Textarea
              placeholder="e.g. Budget exceeded for this quarter."
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
        {isApproving ? "Approving..." : "Approve Request"}
      </Button>
    </div>
  );
}
