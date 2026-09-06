"use client";

import { useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { useToast } from "@/components/astryx/toast-provider";
import { Check, Trash2, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { RejectModal } from "@/components/reject-modal";

type Project = {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "approved" | "rejected" | null;
  githubUrl: string | null;
  liveUrl: string | null;
  images: unknown[];
  teamMembers: unknown[];
  submittedBy: string | null;
};

const statuses = ["pending", "approved", "rejected"];

export default function ProjectsClient({ initialProjects, canReview, canDelete, currentUserId }: { initialProjects: Project[]; canReview: boolean; canDelete: boolean; currentUserId: string }) {
  const [projects, setProjects] = useState(initialProjects);
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectProjectId, setRejectProjectId] = useState<string | null>(null);
  const { success, error } = useToast();

  const updateStatus = async (projectId: string, newStatus: "approved" | "rejected", reasonCode?: string, reasonNote?: string) => {
    setLoading(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reasonCode, reasonNote }),
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Project review could not be saved");
      setProjects(current => current.map(project => project.id === projectId ? { ...project, status: newStatus } : project));
      setRejectProjectId(null);
      success(newStatus === "approved" ? "Project approved and published" : "Project rejected with feedback");
    } catch (caughtError) {
      error(caughtError instanceof Error ? caughtError.message : "Project review could not be saved");
    } finally {
      setLoading(null);
    }
  };

  const deleteProject = async (projectId: string) => {
    setLoading(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      setProjects(current => current.filter(project => project.id !== projectId));
      success("Project deleted permanently");
    } catch (caughtError) {
      error(caughtError instanceof Error ? caughtError.message : "Project could not be deleted");
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
              <Card key={project.id} padding={0} className="shadow-sm">
                <VStack gap={3} className="p-4">
                  <HStack justify="between" align="start">
                    <Text weight="semibold" className="text-base flex-1 pr-2">{project.title}</Text>
                    
                    {canDelete ? <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button type="button" aria-label={`Delete ${project.title}`} className="text-muted-foreground hover:text-red-500 transition-colors p-1 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring" disabled={loading === project.id}>
                          <Trash2 aria-hidden="true" className="w-4 h-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            &quot;{project.title}&quot; and remove all of its data and images from our servers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => { void deleteProject(project.id); }}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            {loading === project.id ? "Deleting…" : "Delete Project"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> : null}
                  </HStack>
                  
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
                
                {project.status === "pending" && canReview && project.submittedBy !== currentUserId ? (
                  <div className="flex gap-2 p-3 border-t border-border bg-muted/10">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => setRejectProjectId(project.id)} disabled={loading === project.id}><X aria-hidden="true" /> Reject</Button>
                    <Button size="sm" className="flex-1" onClick={() => updateStatus(project.id, "approved")} disabled={loading === project.id}><Check aria-hidden="true" /> {loading === project.id ? "Approving…" : "Approve"}</Button>
                  </div>
                ) : project.status !== "approved" && project.submittedBy === currentUserId ? (
                  <div className="p-3 border-t border-border bg-muted/10 text-xs text-muted-foreground">{project.status === "pending" ? "Awaiting independent review." : "Review the feedback notification before resubmitting."}</div>
                ) : null}
              </Card>
            ))}
          </VStack>
        </div>
      ))}
      <RejectModal
        isOpen={Boolean(rejectProjectId)}
        onOpenChange={(open) => { if (!open) setRejectProjectId(null); }}
        title="Reject project submission"
        description="Give the project team clear feedback they can act on."
        onConfirm={(code, note) => { if (rejectProjectId) void updateStatus(rejectProjectId, "rejected", code, note); }}
      />
    </div>
  );
}
