"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(10);
  const router = useRouter();

  async function handleReview(status: "approved" | "rejected") {
    setLoading(true);
    try {
      const res = await fetch("/api/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: submissionId, status, pointsAwarded: status === "approved" ? points : 0 }),
      });

      if (!res.ok) {
        throw new Error("Failed to review");
      }

      router.refresh();
    } catch (err) {
      alert("Error reviewing submission");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">Points:</span>
        <Input 
          type="number" 
          value={points} 
          onChange={(e) => setPoints(parseInt(e.target.value) || 0)} 
          className="w-20 h-8"
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button size="sm" variant="default" disabled={loading} onClick={() => handleReview("approved")}>
          Approve
        </Button>
        <Button size="sm" variant="destructive" disabled={loading} onClick={() => handleReview("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
