"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RejectModal } from "@/components/reject-modal";

export function ExpenseActions({ expense, onUpdate, canApprove }: { expense: any, onUpdate: () => void, canApprove: boolean }) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleUpdate = async (status: "approved" | "rejected", reason?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success(`Expense ${status}`);
      setRejecting(false);
      onUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Expense could not be updated");
    } finally {
      setLoading(false);
    }
  };

  if (expense.status !== "pending" || !canApprove) return null;

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
          onClick={() => void handleUpdate("approved")}
          disabled={loading}
        >
          Approve
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
          onClick={() => setRejecting(true)}
          disabled={loading}
        >
          Reject
        </Button>
      </div>
      <RejectModal
        isOpen={rejecting}
        onOpenChange={setRejecting}
        title="Reject Expense"
        description="Give the submitter a clear reason so they can correct the expense."
        onConfirm={(code, note) => void handleUpdate("rejected", `${code}${note ? `: ${note}` : ""}`)}
      />
    </>
  );
}
