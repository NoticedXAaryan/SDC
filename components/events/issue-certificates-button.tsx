"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Award, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function IssueCertificatesButton({
  eventId,
  templateId,
  eligibleCount,
}: {
  eventId: string;
  templateId: string;
  eligibleCount: number;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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
        setIsOpen(false);
        router.refresh();
      } else {
        toast.error(data.error || "Failed to issue certificates.");
      }
    } catch {
      toast.error("Certificate delivery could not be started. Try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          disabled={isLoading || eligibleCount === 0}
          className="mt-4 flex w-full items-center justify-center gap-2"
        >
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
          Issue {eligibleCount} certificate{eligibleCount === 1 ? "" : "s"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Issue certificates to verified attendees?</AlertDialogTitle>
          <AlertDialogDescription>
            This queues {eligibleCount} personalized PDF certificate{eligibleCount === 1 ? "" : "s"} and sends each one by email. Existing valid certificates are skipped.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(event) => {
              event.preventDefault();
              void handleIssue();
            }}
          >
            {isLoading ? "Starting delivery…" : "Issue certificates"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
