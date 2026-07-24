"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@/components/astryx/toast-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type Applicant = {
  id: string;
  name: string;
  email: string;
};

export function ScheduleInterviewDialog({ applicants }: { applicants: Applicant[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const [applicantId, setApplicantId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [meetingLink, setMeetingLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantId || !scheduledAt) {
      error("Please fill all required fields");
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

      success("Interview scheduled successfully");
      setOpen(false);
      
      // Reset form
      setApplicantId("");
      setScheduledAt("");
      setMeetingLink("");
      
      router.refresh();
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applicantOptions = applicants.map(app => ({
    value: app.id,
    label: `${app.name} (${app.email})`
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button label="Schedule Interview" variant="primary" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Set up a meeting with a candidate currently in the interviewing stage.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="pt-4">
          <FormLayout>
            <Selector
              htmlName="applicant"
              label="Applicant"
              options={applicantOptions}
              value={applicantId}
              onChange={(val) => setApplicantId(val || "")}
              isRequired
              isDisabled={applicants.length === 0}
            />
            
            <TextInput
              htmlName="datetime"
              label="Date & Time"
              type="text"
              value={scheduledAt}
              onChange={setScheduledAt}
              isRequired
              placeholder="YYYY-MM-DDTHH:MM"
            />
            
            <TextInput
              htmlName="link"
              label="Meeting Link (Optional)"
              type="text"
              placeholder="https://meet.google.com/..."
              value={meetingLink}
              onChange={setMeetingLink}
            />
            
            <div className="flex justify-end pt-2 gap-2">
              <Button 
                type="button" 
                variant="ghost" 
                label="Cancel" 
                onClick={() => setOpen(false)} 
                isDisabled={loading} 
              />
              <Button 
                type="submit" 
                variant="primary" 
                label={loading ? "Scheduling..." : "Schedule"} 
                isDisabled={loading || !applicantId || !scheduledAt} 
              />
            </div>
          </FormLayout>
        </form>
      </DialogContent>
    </Dialog>
  );
}
