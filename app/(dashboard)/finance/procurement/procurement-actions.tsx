"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ProcurementActions({ reqId, status }: { reqId: string, status: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/procurement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      toast.success(`Procurement ${newStatus}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status !== "draft" && status !== "quotes_received") return null;

  return (
    <div className="flex gap-2">
      {status === "draft" && (
        <Button variant="outline" size="sm" onClick={() => handleUpdate("quotes_received")} disabled={loading}>
          Mark Quotes Received
        </Button>
      )}
      {status === "quotes_received" && (
        <>
          <Button variant="outline" size="sm" className="text-emerald-500" onClick={() => handleUpdate("approved")} disabled={loading}>
            Approve
          </Button>
          <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleUpdate("rejected")} disabled={loading}>
            Reject
          </Button>
        </>
      )}
    </div>
  );
}
