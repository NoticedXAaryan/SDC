"use client";

import { useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { useToast } from "@/components/astryx/toast-provider";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | null;
  githubUrl: string | null;
  liveUrl: string | null;
  images: any | null;
};

const statuses = ["pending", "approved", "rejected"];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" }
];

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState<string | null>(null);
  const { success, error } = useToast();

  const updateStatus = async (projectId: string, newStatus: string) => {
    setLoading(projectId);
    try {
      // Optimistically update
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus as any } : p));
      success("Status updated");
    } catch (e: any) {
      error("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 h-full">
      {statuses.map(status => (
        <div key={status} className="flex flex-col gap-3 min-w-[320px] w-[320px] bg-muted/30 p-4 rounded-xl border border-border h-full">
          <HStack justify="between" align="center" className="mb-2 px-1">
            <Text weight="semibold" className="text-sm capitalize">{status}</Text>
            <Badge 
              variant="neutral"
              label={projects.filter(p => (p.status || "pending") === status).length.toString()} 
            />
          </HStack>
          
          <VStack gap={3} className="flex-1 overflow-y-auto pr-1">
            {projects.filter(p => (p.status || "pending") === status).map(project => (
              <Card key={project.id} padding={0} className="shadow-sm cursor-grab active:cursor-grabbing">
                <VStack gap={3} className="p-4">
                  <Text weight="semibold" className="text-base">{project.title}</Text>
                  
                  <Text type="supporting" className="text-sm line-clamp-3">
                    {project.description || "No description"}
                  </Text>
                  
                  <HStack gap={3}>
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline font-medium">GitHub</a>
                    )}
                    {project.liveUrl && (
                      <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline font-medium">Demo</a>
                    )}
                  </HStack>
                </VStack>
                
                <div className="p-3 border-t border-border bg-muted/10">
                  <Selector
                    htmlName={`status-${project.id}`}
                    label=""
                    options={STATUS_OPTIONS}
                    value={project.status || "pending"}
                    onChange={(val) => updateStatus(project.id as string, val)}
                    isDisabled={loading === project.id}
                  />
                </div>
              </Card>
            ))}
          </VStack>
        </div>
      ))}
    </div>
  );
}
