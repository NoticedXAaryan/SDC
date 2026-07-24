"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Card } from "@astryxdesign/core/Card";
import { FormLayout } from "@astryxdesign/core/FormLayout";
import { VStack } from "@astryxdesign/core/VStack";
import { useToast } from "@/components/astryx/toast-provider";

export function SubmitProjectForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [teamMembers, setTeamMembers] = useState(""); // Comma separated for now
  const [imageUrl, setImageUrl] = useState(""); // Single image for now

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      error("Title and description are required");
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

      success("Project submitted successfully. Pending approval.");
      router.push("/projects");
      router.refresh();
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding={6}>
      <form onSubmit={handleSubmit}>
        <VStack gap={6}>
          <FormLayout>
            <TextInput
              htmlName="title"
              label="Project Title"
              value={title}
              onChange={setTitle}
              isRequired
            />
            
            <TextArea 
              htmlName="description"
              label="Description"
              value={description} 
              onChange={setDescription} 
              isRequired 
              placeholder="What did you build? What technologies did you use?"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                htmlName="github"
                label="GitHub URL"
                value={githubUrl}
                onChange={setGithubUrl}
                placeholder="https://github.com/..."
              />
              
              <TextInput
                htmlName="live"
                label="Live URL"
                value={liveUrl}
                onChange={setLiveUrl}
                placeholder="https://..."
              />
            </div>
            
            <TextInput
              htmlName="team"
              label="Team Members"
              value={teamMembers}
              onChange={setTeamMembers}
              placeholder="Alice, Bob (comma separated)"
            />
            
            <TextInput
              htmlName="image"
              label="Cover Image URL"
              value={imageUrl}
              onChange={setImageUrl}
              placeholder="https://..."
            />
          </FormLayout>
          
          <Button 
            type="submit" 
            isDisabled={loading} 
            className="w-full justify-center"
            label={loading ? "Submitting..." : "Submit Project"}
            variant="primary"
          />
        </VStack>
      </form>
    </Card>
  );
}
