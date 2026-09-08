"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RejectModal } from "@/components/reject-modal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProcurementStatus =
  | "draft"
  | "pending_quotes"
  | "approval"
  | "approved"
  | "rejected"
  | "completed";

export function ProcurementActions({
  reqId,
  status,
  vendors,
  selectedVendorId: initialVendorId,
  quotesUrl: initialQuotesUrl,
  canProgress,
  canApprove,
}: {
  reqId: string;
  status: string;
  vendors: Array<{ id: string; name: string }>;
  selectedVendorId?: string | null;
  quotesUrl?: string | null;
  canProgress: boolean;
  canApprove: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [preparingApproval, setPreparingApproval] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState(initialVendorId || "");
  const [quotesUrl, setQuotesUrl] = useState(initialQuotesUrl || "");
  const router = useRouter();
  const normalizedStatus = status as ProcurementStatus;

  const handleUpdate = async (
    newStatus: ProcurementStatus,
    options?: { reason?: string; selectedVendorId?: string; quotesUrl?: string },
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId, status: newStatus, ...options }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update procurement request");

      toast.success(data.message || `Procurement updated to ${newStatus.replaceAll("_", " ")}`);
      setPreparingApproval(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update procurement request");
    } finally {
      setLoading(false);
    }
  };

  const canReject = canApprove && ["pending_quotes", "approval"].includes(normalizedStatus);
  const hasAction =
    (normalizedStatus === "draft" && canProgress) ||
    (normalizedStatus === "pending_quotes" && canProgress) ||
    (normalizedStatus === "approval" && canApprove) ||
    (normalizedStatus === "approved" && (canProgress || canApprove)) ||
    canReject;

  if (!hasAction) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canReject && (
          <Button variant="outline" size="sm" className="text-red-500" onClick={() => setRejecting(true)} disabled={loading}>
            Reject
          </Button>
        )}
        {normalizedStatus === "draft" && canProgress ? (
          <Button variant="outline" size="sm" onClick={() => handleUpdate("pending_quotes")} disabled={loading}>{loading ? "Updating…" : "Request Quotes"}</Button>
        ) : null}
        {normalizedStatus === "pending_quotes" && canProgress ? (
          <Button size="sm" onClick={() => setPreparingApproval(true)} disabled={loading}>Prepare Approval</Button>
        ) : null}
        {normalizedStatus === "approval" && canApprove ? (
          <Button size="sm" onClick={() => handleUpdate("approved")} disabled={loading}>{loading ? "Updating…" : "Approve Request"}</Button>
        ) : null}
        {normalizedStatus === "approved" && (canProgress || canApprove) ? (
          <Button size="sm" onClick={() => handleUpdate("completed")} disabled={loading}>{loading ? "Updating…" : "Mark Received"}</Button>
        ) : null}
      </div>

      <Dialog open={preparingApproval} onOpenChange={setPreparingApproval}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prepare Request for Approval</DialogTitle>
            <DialogDescription>Select the preferred vendor and attach the quote reviewers should use.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(event) => { event.preventDefault(); void handleUpdate("approval", { selectedVendorId, quotesUrl: quotesUrl.trim() }); }} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor={`procurement-vendor-${reqId}`}>Selected vendor</Label>
              <Select name="selectedVendorId" value={selectedVendorId} onValueChange={(value) => setSelectedVendorId(value || "")} required>
                <SelectTrigger id={`procurement-vendor-${reqId}`} className="w-full"><SelectValue placeholder="Select a vendor…" /></SelectTrigger>
                <SelectContent>{vendors.map((vendor) => <SelectItem key={vendor.id} value={vendor.id}>{vendor.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`procurement-quote-${reqId}`}>Quote URL</Label>
              <Input id={`procurement-quote-${reqId}`} name="quotesUrl" type="url" inputMode="url" autoComplete="url" placeholder="https://…" value={quotesUrl} onChange={(event) => setQuotesUrl(event.target.value)} required />
            </div>
            {vendors.length === 0 ? <p className="text-sm text-muted-foreground">A finance manager must add a vendor before this request can be submitted.</p> : null}
            <Button type="submit" className="w-full" disabled={loading || !selectedVendorId || !quotesUrl.trim()}>{loading ? "Submitting…" : "Submit for Approval"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <RejectModal
        isOpen={rejecting}
        onOpenChange={setRejecting}
        title="Reject procurement request"
        description="Give the requester a clear reason for rejecting this procurement request."
        onConfirm={(code, note) => handleUpdate("rejected", { reason: `${code}${note ? `: ${note}` : ""}` })}
      />
    </>
  );
}
