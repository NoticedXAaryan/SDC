"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { RejectModal } from "@/components/reject-modal";

type Project = {
  id: string;
  title: string;
  description: string;
  githubUrl: string | null;
  liveUrl: string | null;
  teamMembers: any;
  images: any;
  status: string | null;
};

export function ProjectApprovalList({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [rejectProjectId, setRejectProjectId] = useState<string | null>(null);
  const router = useRouter();

  const handleAction = async (id: string, action: "approve" | "reject", reasonCode?: string, reasonNote?: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "approve" ? "approved" : "rejected", reasonCode, reasonNote })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update project");
      }

      toast.success(`Project ${action}d successfully`);
      setProjects(prev => prev.filter(p => p.id !== id));
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center p-12 bg-muted/50 rounded-lg border border-dashed">
        <p className="text-muted-foreground">No pending projects.</p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {projects.map(project => (
        <Card key={project.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription className="mt-1">
                  Team: {Array.isArray(project.teamMembers) ? project.teamMembers.map((m: any) => m.name).join(", ") : "Unknown"}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="capitalize">{project.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{project.description}</p>
            
            <div className="flex gap-4 text-sm">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  GitHub
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  Live Site
                </a>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button variant="destructive" onClick={() => setRejectProjectId(project.id)}>Reject</Button>
            <Button onClick={() => handleAction(project.id, "approve")}>Approve</Button>
          </CardFooter>
        </Card>
      ))}
    </div>
      <RejectModal
        isOpen={!!rejectProjectId}
        onOpenChange={(open) => !open && setRejectProjectId(null)}
        onConfirm={(code, note) => {
          if (rejectProjectId) handleAction(rejectProjectId, "reject", code, note);
        }}
        title="Reject Project"
        description="Please provide a reason for rejecting this project submission."
      />
    </>
  );
}
