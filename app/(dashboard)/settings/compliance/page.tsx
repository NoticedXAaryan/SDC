"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertTriangle, Download, Trash2 } from "lucide-react";

export default function CompliancePage() {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const router = useRouter();

  const handleExportData = async () => {
    setLoadingExport(true);
    try {
      const res = await fetch("/api/compliance/export");
      if (!res.ok) throw new Error("Failed to export data");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-sdc-data.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Data exported successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your data immediately.")) {
      return;
    }
    
    setLoadingDelete(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      
      toast.success("Account deleted successfully.");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message);
      setLoadingDelete(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Privacy & Compliance</h1>
        <p className="text-muted-foreground">Manage your personal data in accordance with GDPR regulations.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export My Data
            </CardTitle>
            <CardDescription>
              Download a complete copy of all your personal data, applications, and logs stored on our servers.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The data will be provided in JSON format, which is machine-readable and portable.
          </CardContent>
          <CardFooter>
            <Button onClick={handleExportData} disabled={loadingExport}>
              {loadingExport ? "Preparing Export..." : "Request Data Export"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/50 border">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action is irreversible.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Once deleted, your profile, applications, and settings will be removed from our active database within 30 days.
          </CardContent>
          <CardFooter>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={loadingDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              {loadingDelete ? "Deleting..." : "Delete Account"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
