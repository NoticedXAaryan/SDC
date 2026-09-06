"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SubmitProjectDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", githubUrl: "", liveUrl: "" });
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || "Project could not be submitted");
      toast.success("Project submitted for review");
      setOpen(false);
      setForm({ title: "", description: "", githubUrl: "", liveUrl: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Project could not be submitted");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}><Plus aria-hidden="true" /> Submit Project</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit a Club Project</DialogTitle>
          <DialogDescription>Approved projects appear in the shared gallery. You will be notified when the review is complete.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2"><Label htmlFor="project-title">Project title</Label><Input id="project-title" name="title" minLength={5} maxLength={160} autoComplete="off" value={form.title} onChange={(event) => setForm(current => ({ ...current, title: event.target.value }))} required /></div>
          <div className="space-y-2"><Label htmlFor="project-description">What you built</Label><Textarea id="project-description" name="description" minLength={20} maxLength={5000} placeholder="Explain the problem, your solution, and the outcome." value={form.description} onChange={(event) => setForm(current => ({ ...current, description: event.target.value }))} required /></div>
          <div className="space-y-2"><Label htmlFor="project-github">GitHub URL (optional)</Label><Input id="project-github" name="githubUrl" type="url" inputMode="url" autoComplete="url" placeholder="https://github.com/…" value={form.githubUrl} onChange={(event) => setForm(current => ({ ...current, githubUrl: event.target.value }))} /></div>
          <div className="space-y-2"><Label htmlFor="project-live">Live demo URL (optional)</Label><Input id="project-live" name="liveUrl" type="url" inputMode="url" autoComplete="url" placeholder="https://…" value={form.liveUrl} onChange={(event) => setForm(current => ({ ...current, liveUrl: event.target.value }))} /></div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Submitting…" : "Submit for Review"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
