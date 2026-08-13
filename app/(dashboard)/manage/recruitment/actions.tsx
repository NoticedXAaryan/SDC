"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function ApplicationActions({ application }: { application: any }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (status: string, reasonCode?: string, reasonNote?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${application.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reasonCode, reasonNote })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      
      toast.success(`Application marked as ${status}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reasonCode = prompt("Enter a brief reason code (e.g., 'not-enough-experience', 'no-portfolio'):");
    if (!reasonCode) return;
    
    setLoading(true);
    try {
      // Generate AI Rejection
      const aiRes = await fetch("/api/ai/generate-rejection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reasonCode, context: `Application for ${application.domain} domain.` })
      });
      const aiData = await aiRes.json();
      if (!aiRes.ok) throw new Error(aiData.error || "Failed to generate rejection");
      
      await updateStatus("rejected", reasonCode, aiData.note);
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleInterview = async () => {
    // Ideally this would open a modal to schedule the interview, but we'll mock the API call for simplicity
    const dateStr = prompt("Enter date/time for interview (YYYY-MM-DDTHH:MM:SS):", new Date().toISOString().slice(0, 19));
    if (!dateStr) return;
    
    setLoading(true);
    try {
      // First update status to interviewing
      await updateStatus("interviewing");
      
      // Then schedule interview
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId: application.id,
          scheduledAt: new Date(dateStr).toISOString(),
          meetingLink: "https://meet.google.com/xyz-abc-def"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule interview");
      
      toast.success("Interview scheduled");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
  }

  return (
    <div className="flex gap-2">
      {/* State Machine UI Enforcement */}
      {application.status === "applied" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("ai_graded")}>Trigger Grader</Button>
      )}
      
      {(application.status === "ai_graded" || application.status === "needs_manual_review") && (
        <>
          <Button size="sm" variant="default" onClick={handleInterview}>Schedule Interview</Button>
          <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
        </>
      )}
      
      {application.status === "interviewing" && (
        <>
          <Button size="sm" variant="default" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus("accepted")}>Accept (Offer)</Button>
          <Button size="sm" variant="destructive" onClick={handleReject}>Reject</Button>
        </>
      )}
    </div>
  );
}
