"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Applicant = {
  id: string;
  name: string;
  email: string;
};

export function ScheduleInterviewDialog({ applicants }: { applicants: Applicant[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [applicantId, setApplicantId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantId || !scheduledAt) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      // Create date object (scheduledAt is from datetime-local input, so local time)
      const date = new Date(scheduledAt);
      
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicantId,
          scheduledAt: date.toISOString(),
          meetingLink: meetingLink || undefined
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to schedule interview");
      }

      toast.success("Interview scheduled successfully");
      setOpen(false);
      
      // Reset form
      setApplicantId("");
      setScheduledAt("");
      setMeetingLink("");
      
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Schedule Interview</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Schedule Interview</DialogTitle>
            <DialogDescription>
              Set up a meeting with a candidate currently in the interviewing stage.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="applicant">Applicant</Label>
              <Select value={applicantId} onValueChange={(val) => setApplicantId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select applicant" />
                </SelectTrigger>
                <SelectContent>
                  {applicants.length === 0 ? (
                    <SelectItem value="none" disabled>No applicants in interviewing stage</SelectItem>
                  ) : (
                    applicants.map(app => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.name} ({app.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link">Meeting Link (Optional)</Label>
              <Input
                id="link"
                type="url"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !applicantId || !scheduledAt}>
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
