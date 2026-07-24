"use client";

import { useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { useRouter } from "next/navigation";
import { RejectModal } from "@/components/reject-modal";

const COLUMNS = [
  { id: "applied", label: "New Applications" },
  { id: "ai_graded", label: "AI Graded" },
  { id: "interviewing", label: "Interview" },
  { id: "accepted", label: "Accepted" },
  { id: "rejected", label: "Rejected" },
];

export function ApplicationsBoard({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectAppId, setRejectAppId] = useState<string | null>(null);
  const router = useRouter();

  const handleStatusChange = async (applicationId: string, newStatus: string, reasonCode?: string, reasonNote?: string) => {
    setLoading(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reasonCode, reasonNote })
      });
      
      if (res.ok) {
        setData(prev => prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        ));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-250px)]">
        {COLUMNS.map(col => (
          <div key={col.id} className="min-w-[320px] w-[320px] bg-muted/30 rounded-xl p-4 flex flex-col border border-border">
            <HStack justify="between" align="center" className="mb-4 px-1">
              <Text weight="semibold" className="text-sm">{col.label}</Text>
              <Badge 
                variant="neutral" 
                label={data.filter(app => app.status === col.id).length.toString()} 
              />
            </HStack>

            <VStack gap={3} className="flex-1 overflow-y-auto pr-1">
              {data.filter(app => app.status === col.id).map(app => (
                <Card key={app.id} padding={4}>
                  <VStack gap={3}>
                    <HStack justify="between" align="start">
                      <VStack gap={0}>
                        <Text weight="medium">{app.user?.name || "Unknown"}</Text>
                        <Text type="supporting" className="text-xs">{app.user?.email}</Text>
                      </VStack>
                      {app.aiScore !== null && (
                        <Badge 
                          variant={
                            app.aiScore >= 80 ? "success" : 
                            app.aiScore >= 50 ? "warning" : "error"
                          }
                          label={`${app.aiScore}/100`}
                        />
                      )}
                    </HStack>

                    {app.aiFeedback && (
                      <Text type="supporting" className="text-xs line-clamp-2 italic">
                        "{app.aiFeedback}"
                      </Text>
                    )}

                    <div className="pt-3 border-t border-border mt-auto">
                      {col.id === "applied" && (
                        <Button 
                          variant="ghost" 
                          label="Simulate AI Grade" 
                          onClick={() => handleStatusChange(app.id, "ai_graded")}
                          isDisabled={loading === app.id}
                        />
                      )}
                      {col.id === "ai_graded" && (
                        <Button 
                          variant="primary" 
                          label="Invite to Interview" 
                          onClick={() => handleStatusChange(app.id, "interviewing")}
                          isDisabled={loading === app.id}
                        />
                      )}
                      {col.id === "interviewing" && (
                        <HStack gap={2}>
                          <Button 
                            variant="primary" 
                            label="Accept" 
                            onClick={() => handleStatusChange(app.id, "accepted")}
                            isDisabled={loading === app.id}
                          />
                          <Button 
                            variant="destructive" 
                            label="Reject" 
                            onClick={() => setRejectAppId(app.id)}
                            isDisabled={loading === app.id}
                          />
                        </HStack>
                      )}
                    </div>
                  </VStack>
                </Card>
              ))}
            </VStack>
          </div>
        ))}
      </div>
      
      <RejectModal
        isOpen={!!rejectAppId}
        onOpenChange={(open) => !open && setRejectAppId(null)}
        onConfirm={(code, note) => {
          if (rejectAppId) handleStatusChange(rejectAppId, "rejected", code, note);
        }}
        title="Reject Application"
        description="Please provide a reason for rejecting this application."
      />
    </>
  );
}
