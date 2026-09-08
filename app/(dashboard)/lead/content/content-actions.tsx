"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

type ContentStatus = "idea" | "drafting" | "review" | "scheduled" | "published";

const NEXT_ACTION: Partial<Record<ContentStatus, { label: string; status: ContentStatus }>> = {
  idea: { label: "Start Draft", status: "drafting" },
  drafting: { label: "Send to Review", status: "review" },
  review: { label: "Approve Schedule", status: "scheduled" },
  scheduled: { label: "Mark Published", status: "published" },
};

export function ContentActions({ id, status, hasSchedule }: { id: string; status: ContentStatus; hasSchedule: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const action = NEXT_ACTION[status];
  if (!action) return null;

  async function advance() {
    setLoading(true);
    try {
      const response = await fetch("/api/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: action?.status }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Content status could not be updated");
      toast.success(`Content moved to ${action?.status}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Content status could not be updated");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" className="w-full" onClick={() => { void advance(); }} disabled={loading || (action.status === "scheduled" && !hasSchedule)}>
      {loading ? "Updating…" : action.label}
    </Button>
  );
}
