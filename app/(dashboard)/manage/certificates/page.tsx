"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

export default function CertificatesManagementPage() {
  const [loading, setLoading] = useState(false);
  
  const handleBulkGenerate = async () => {
    setLoading(true);
    // Mock call for UI demonstration
    setTimeout(() => {
      toast.success("Batch #452 queued for generation");
      setLoading(false);
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Certificate Management</h2>
          <p className="text-muted-foreground">Manage templates and issue certificates</p>
        </div>
        <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Upload Template</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Issue Certificates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg bg-zinc-50 dark:bg-zinc-900">
              <h4 className="font-semibold text-sm mb-1">Batch #452</h4>
              <p className="text-xs text-muted-foreground mb-4">Pending approval for Tech Talk 2026 (120 attendees)</p>
              <div className="flex gap-2">
                <Button onClick={handleBulkGenerate} disabled={loading} size="sm">
                  {loading ? <RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                  Generate Batch
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">Reject</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-sm border-b pb-2">
                 <span>Batch #451 Issued</span>
                 <span className="text-muted-foreground text-xs">2 days ago</span>
               </div>
               <div className="flex justify-between items-center text-sm border-b pb-2">
                 <span>Certificate CERT-9912 Revoked</span>
                 <span className="text-muted-foreground text-xs">4 days ago</span>
               </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
