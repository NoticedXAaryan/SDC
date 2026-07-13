"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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

export default function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (projectId: string, newStatus: string) => {
    setLoading(projectId);
    try {
      // Optimistically update
      setProjects(projects.map(p => p.id === projectId ? { ...p, status: newStatus as any } : p));
      toast.success("Status updated");
    } catch (e: any) {
      toast.error("Failed to update status");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-x-auto pb-4">
      {statuses.map(status => (
        <div key={status} className="flex flex-col gap-3 min-w-[280px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
            <h3 className="font-semibold capitalize">{status}</h3>
            <Badge variant="secondary">{projects.filter(p => (p.status || "pending") === status).length}</Badge>
          </div>
          
          <div className="flex flex-col gap-3">
            {projects.filter(p => (p.status || "pending") === status).map(project => (
              <Card key={project.id} className="shadow-sm cursor-grab active:cursor-grabbing border-muted-foreground/20">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground">
                  <p className="line-clamp-2">{project.description || "No description"}</p>
                  <div className="mt-3 flex gap-2">
                    {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">GitHub</a>}
                    {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">Demo</a>}
                  </div>
                </CardContent>
                <CardFooter className="p-2 border-t flex justify-end bg-muted/20">
                  <Select
                    disabled={loading === project.id}
                    value={project.status || "pending"}
                    onValueChange={(val) => updateStatus(project.id as string, val as string)}
                  >
                    <SelectTrigger className="h-7 text-xs w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
