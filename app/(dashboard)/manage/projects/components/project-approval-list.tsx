"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { EmptyState } from "@/components/astryx/empty-state";
import { useToast } from "@/components/astryx/toast-provider";
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
  const { success, error } = useToast();

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

      success(`Project ${action}d successfully`);
      setProjects(prev => prev.filter(p => p.id !== id));
      router.refresh();
    } catch (err: any) {
      error(err.message);
    }
  };

  if (projects.length === 0) {
    return (
      <EmptyState
        title="No pending projects"
        description="There are currently no projects awaiting approval."
      />
    );
  }

  return (
    <>
    <div className="space-y-6">
      {projects.map(project => (
        <Card key={project.id} padding={6}>
          <VStack gap={4}>
            <HStack justify="between" align="start">
              <VStack gap={1}>
                <Text weight="bold" className="text-xl">{project.title}</Text>
                <Text type="supporting" className="text-sm">
                  Team: {Array.isArray(project.teamMembers) ? project.teamMembers.map((m: any) => m.name).join(", ") : "Unknown"}
                </Text>
              </VStack>
              <Badge variant="neutral" label={project.status || "pending"} className="capitalize" />
            </HStack>
            
            <Text className="text-sm">{project.description}</Text>
            
            <HStack gap={4} className="text-sm border-t border-border pt-4">
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">
                  GitHub
                </a>
              )}
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-primary font-medium hover:underline">
                  Live Site
                </a>
              )}
            </HStack>

            <HStack justify="end" gap={2} className="border-t border-border pt-4">
              <Button variant="destructive" label="Reject" onClick={() => setRejectProjectId(project.id)} />
              <Button variant="primary" label="Approve" onClick={() => handleAction(project.id, "approve")} />
            </HStack>
          </VStack>
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
