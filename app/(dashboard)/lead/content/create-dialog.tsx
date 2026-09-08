"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

export function CreateContentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    platform: "twitter",
    scheduledFor: "",
  });

  const handleAI = async () => {
    if (!formData.title) {
      toast.error("Enter a topic in the title field first.");
      return;
    }
    setDrafting(true);
    try {
      const res = await fetch("/api/content/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: formData.title, platform: formData.platform }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Draft could not be generated");
      setFormData(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
      }));
      toast.success("Draft generated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Draft could not be generated");
    } finally {
      setDrafting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledFor: formData.scheduledFor ? new Date(formData.scheduledFor).toISOString() : undefined,
        }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Content item could not be created");
      toast.success("Content draft created");
      setOpen(false);
      setFormData({ title: "", description: "", platform: "twitter", scheduledFor: "" });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Content item could not be created");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        Create Content
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Content Item</DialogTitle>
          <DialogDescription>Create a working draft and optionally set its target publication date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="content-title">Topic / Title</Label>
            <Input 
              id="content-title"
              name="title"
              autoComplete="off"
              minLength={3}
              maxLength={160}
              placeholder="Upcoming hackathon announcement"
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content-platform">Platform</Label>
            <Select name="platform" value={formData.platform} onValueChange={(val) => setFormData(current => ({ ...current, platform: val || "twitter" }))}>
              <SelectTrigger id="content-platform" className="w-full">
                <SelectValue placeholder="Select Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="twitter">Twitter / X</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="blog">Blog Post</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content-description">Post Content</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAI} disabled={drafting}>
                {drafting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                AI Draft
              </Button>
            </div>
            <Textarea 
              id="content-description"
              name="description"
              maxLength={5000}
              className="min-h-[150px]"
              placeholder="Post description..." 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-schedule">Target publication date (optional)</Label>
            <Input 
              id="content-schedule"
              name="scheduledFor"
              type="datetime-local"
              value={formData.scheduledFor} 
              onChange={e => setFormData({ ...formData, scheduledFor: e.target.value })} 
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {loading ? "Saving…" : "Save Draft"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
