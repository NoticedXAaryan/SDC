"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
      if (!res.ok) throw new Error("Failed to draft");
      const data = await res.json();
      setFormData(prev => ({
        ...prev,
        title: data.title,
        description: data.description,
      }));
      toast.success("Draft generated!");
    } catch (err: any) {
      toast.error(err.message);
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
      if (!res.ok) throw new Error("Failed to create content");
      toast.success("Content item created!");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* @ts-ignore */}
      <DialogTrigger asChild>
        <Button>Create Content</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Content Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Topic / Title</label>
            <Input 
              placeholder="e.g. Next upcoming hackathon announcement" 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Platform</label>
            <Select value={formData.platform} onValueChange={(val) => setFormData({ ...formData, platform: val || "twitter" })}>
              <SelectTrigger>
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
              <label className="text-sm font-medium">Post Content</label>
              <Button type="button" variant="outline" size="sm" onClick={handleAI} disabled={drafting}>
                {drafting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                AI Draft
              </Button>
            </div>
            <Textarea 
              className="min-h-[150px]"
              placeholder="Post description..." 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Schedule For</label>
            <Input 
              type="datetime-local" 
              value={formData.scheduledFor} 
              onChange={e => setFormData({ ...formData, scheduledFor: e.target.value })} 
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Item
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
