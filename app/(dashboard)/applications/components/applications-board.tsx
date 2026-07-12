"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setLoading(applicationId);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
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
    <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
      {COLUMNS.map(col => (
        <div key={col.id} className="min-w-[320px] bg-muted/30 rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">{col.label}</h3>
            <span className="text-xs bg-muted px-2 py-1 rounded-full">
              {data.filter(app => app.status === col.id).length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {data.filter(app => app.status === col.id).map(app => (
              <div key={app.id} className="bg-card border rounded-lg p-4 shadow-sm text-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{app.user.name}</p>
                    <p className="text-xs text-muted-foreground">{app.user.email}</p>
                  </div>
                  {app.aiScore !== null && (
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      app.aiScore >= 80 ? 'bg-green-100 text-green-800' : 
                      app.aiScore >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.aiScore}/100
                    </div>
                  )}
                </div>

                {app.aiFeedback && (
                  <p className="text-xs text-muted-foreground line-clamp-2 italic">
                    "{app.aiFeedback}"
                  </p>
                )}

                <div className="flex gap-2 mt-auto pt-2 border-t flex-wrap">
                  {col.id === "applied" && (
                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleStatusChange(app.id, "ai_graded")}>
                      Simulate AI Grade
                    </Button>
                  )}
                  {col.id === "ai_graded" && (
                    <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStatusChange(app.id, "interviewing")}>
                      Invite to Interview
                    </Button>
                  )}
                  {col.id === "interviewing" && (
                    <div className="flex gap-2 w-full">
                      <Button variant="default" size="sm" className="flex-1" onClick={() => handleStatusChange(app.id, "accepted")}>Accept</Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleStatusChange(app.id, "rejected")}>Reject</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
