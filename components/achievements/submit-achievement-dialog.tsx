"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { useToast } from "@/components/astryx/toast-provider";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SubmitAchievementDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  
  const router = useRouter();
  const { error, success } = useToast();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (title.length < 5) {
      error("Title must be at least 5 characters");
      return;
    }
    if (description.length < 10) {
      error("Description must be at least 10 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, proofUrl: proofUrl || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit achievement");
      }

      success("Achievement submitted successfully!");
      setOpen(false);
      setTitle("");
      setDescription("");
      setProofUrl("");
      router.refresh();
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button label="Submit Achievement" variant="primary" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit Achievement</DialogTitle>
          <DialogDescription>
            Report a new milestone, project, or competition win to earn points.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="pt-4">
          <FormLayout>
            <TextInput
              label="Title"
              htmlName="title"
              value={title}
              onChange={setTitle}
              placeholder="e.g. 1st Place at Hackathon"
              isRequired
            />
            <TextArea
              label="Description"
              htmlName="description"
              value={description}
              onChange={setDescription}
              placeholder="Describe what you did..."
              isRequired
            />
            <TextInput
              label="Proof URL (Optional)"
              htmlName="proofUrl"
              type="text"
              value={proofUrl}
              onChange={setProofUrl}
              placeholder="https://..."
            />
            <div className="flex justify-end pt-2">
              <Button 
                type="submit" 
                label={loading ? "Submitting..." : "Submit"} 
                variant="primary" 
                isDisabled={loading} 
              />
            </div>
          </FormLayout>
        </form>
      </DialogContent>
    </Dialog>
  );
}
