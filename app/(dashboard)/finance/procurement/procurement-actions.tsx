"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RejectModal } from "@/components/reject-modal";
import { Button } from "@/components/ui/button";

type ProcurementStatus =
  | "draft"
  | "pending_quotes"
  | "approval"
  | "approved"
  | "rejected"
  | "completed";

const NEXT_ACTIONS: Partial<Record<ProcurementStatus, Array<{
  label: string;
  status: ProcurementStatus;
  variant?: "default" | "outline";
}>>> = {
  draft: [{ label: "Request quotes", status: "pending_quotes", variant: "outline" }],
  pending_quotes: [{ label: "Submit for approval", status: "approval" }],
  approval: [{ label: "Approve request", status: "approved" }],
  approved: [{ label: "Mark completed", status: "completed" }],
};

export function ProcurementActions({
  reqId,
  status,
}: {
  reqId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();
  const normalizedStatus = status as ProcurementStatus;

  const handleUpdate = async (newStatus: ProcurementStatus, reason?: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId, status: newStatus, ...(reason ? { reason } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update procurement request");

      toast.success(data.message || `Procurement updated to ${newStatus.replaceAll("_", " ")}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update procurement request");
    } finally {
      setLoading(false);
    }
  };

  const actions = NEXT_ACTIONS[normalizedStatus] ?? [];
  const canReject = ["pending_quotes", "approval"].includes(normalizedStatus);

  if (actions.length === 0 && !canReject) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canReject && (
          <Button variant="outline" size="sm" className="text-red-500" onClick={() => setRejecting(true)} disabled={loading}>
            Reject
          </Button>
        )}
        {actions.map((action) => (
          <Button key={action.status} variant={action.variant} size="sm" onClick={() => handleUpdate(action.status)} disabled={loading}>
            {loading ? "Updating…" : action.label}
          </Button>
        ))}
      </div>

      <RejectModal
        isOpen={rejecting}
        onOpenChange={setRejecting}
        title="Reject procurement request"
        description="Give the requester a clear reason for rejecting this procurement request."
        onConfirm={(code, note) => handleUpdate("rejected", `${code}${note ? `: ${note}` : ""}`)}
      />
    </>
  );
}
