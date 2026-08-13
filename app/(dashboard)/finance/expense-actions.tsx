"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ExpenseActions({ expense, onUpdate }: { expense: any, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (status: "approved" | "rejected") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/expenses/${expense.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: status === "rejected" ? "Standard rejection" : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success(`Expense ${status}`);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (expense.status !== "pending") return null;

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10" 
        onClick={() => handleUpdate("approved")}
        disabled={loading}
      >
        Approve
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10" 
        onClick={() => handleUpdate("rejected")}
        disabled={loading}
      >
        Reject
      </Button>
    </div>
  );
}
