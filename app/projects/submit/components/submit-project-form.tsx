"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function SubmitProjectForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [teamMembers, setTeamMembers] = useState(""); // Comma separated for now
  const [imageUrl, setImageUrl] = useState(""); // Single image for now

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Title and description are required");
      return;
    }

    setLoading(true);
    try {
      const parsedTeamMembers = teamMembers.split(",").map(m => m.trim()).filter(Boolean).map(name => ({ name }));
      const parsedImages = imageUrl.trim() ? [imageUrl.trim()] : [];

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          githubUrl: githubUrl || undefined,
          liveUrl: liveUrl || undefined,
          teamMembers: parsedTeamMembers,
          images: parsedImages,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit project");
      }

      toast.success("Project submitted successfully. Pending approval.");
      router.push("/projects");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Title <span className="text-destructive">*</span></Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
              rows={4}
              placeholder="What did you build? What technologies did you use?"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github">GitHub URL</Label>
              <Input id="github" type="url" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="live">Live URL</Label>
              <Input id="live" type="url" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="team">Team Members</Label>
            <Input 
              id="team" 
              value={teamMembers} 
              onChange={e => setTeamMembers(e.target.value)} 
              placeholder="Alice, Bob (comma separated)" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="image">Cover Image URL</Label>
            <Input 
              id="image" 
              type="url" 
              value={imageUrl} 
              onChange={e => setImageUrl(e.target.value)} 
              placeholder="https://..." 
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Project"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
