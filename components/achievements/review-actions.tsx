"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { useToast } from "@/components/astryx/toast-provider";
import { RejectModal } from "@/components/reject-modal";

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState("10");
  const [rejecting, setRejecting] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  async function handleReview(status: "approved" | "rejected", reasonCode?: string, reasonNote?: string) {
    setLoading(true);
    try {
      const parsedPoints = parseInt(points) || 0;
      const res = await fetch("/api/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: submissionId, 
          status, 
          pointsAwarded: status === "approved" ? parsedPoints : 0,
          reasonCode,
          reasonNote,
        }),
      });

      if (!res.ok) {
        const result = await res.json().catch(() => null);
        throw new Error(result?.error || "Achievement review could not be saved");
      }

      setRejecting(false);
      success(status === "approved" ? "Achievement approved" : "Achievement rejected with feedback");
      router.refresh();
    } catch (caughtError) {
      error(caughtError instanceof Error ? caughtError.message : "Achievement review could not be saved");
    } finally {
      setLoading(false);
    }
  }

  return (
    <VStack gap={3}>
      <div className="w-32">
        <TextInput
          htmlName={`points-${submissionId}`}
          label="Points to award"
          type="text"
          value={points}
          onChange={setPoints}
        />
      </div>
      <HStack gap={2}>
        <Button 
          label="Approve" 
          variant="primary" 
          isDisabled={loading} 
          onClick={() => handleReview("approved")} 
        />
        <Button 
          label="Reject" 
          variant="destructive" 
          isDisabled={loading} 
          onClick={() => setRejecting(true)}
        />
      </HStack>
      <RejectModal
        isOpen={rejecting}
        onOpenChange={setRejecting}
        title="Reject achievement"
        description="Give the member clear feedback so they can correct the evidence and resubmit."
        onConfirm={(code, note) => { void handleReview("rejected", code, note); }}
      />
    </VStack>
  );
}
