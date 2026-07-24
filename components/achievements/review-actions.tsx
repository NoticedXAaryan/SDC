"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { useToast } from "@/components/astryx/toast-provider";

export function ReviewActions({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState("10");
  const router = useRouter();
  const { success, error } = useToast();

  async function handleReview(status: "approved" | "rejected") {
    setLoading(true);
    try {
      const parsedPoints = parseInt(points) || 0;
      const res = await fetch("/api/achievements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: submissionId, 
          status, 
          pointsAwarded: status === "approved" ? parsedPoints : 0 
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to review");
      }

      success(`Submission ${status} successfully!`);
      router.refresh();
    } catch (err) {
      error("Error reviewing submission");
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
          onClick={() => handleReview("rejected")} 
        />
      </HStack>
    </VStack>
  );
}
