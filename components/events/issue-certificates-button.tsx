"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function IssueCertificatesButton({ eventId, templateId }: { eventId: string, templateId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleIssue() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates/issue-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        toast.success(data.message || "Certificates queued successfully.");
        router.refresh();
      } else {
        toast.error(data.error || "Failed to issue certificates.");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button 
      onClick={handleIssue} 
      disabled={isLoading}
      className="w-full mt-4 flex items-center justify-center gap-2"
      variant="default"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
      Issue Certificates
    </Button>
  );
}
