"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { useToast } from "@/components/astryx/toast-provider";
import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/astryx/page-header";

export default function CompliancePage() {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

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
      
      success("Data exported successfully!");
    } catch (err: any) {
      error(err.message);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your data immediately.")) {
      return;
    }
    
    setLoadingDelete(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete account");
      
      success("Account deleted successfully.");
      router.push("/");
    } catch (err: any) {
      error(err.message);
      setLoadingDelete(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader 
        title="Privacy & Compliance" 
        description="Manage your personal data in accordance with GDPR regulations."
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card padding={6}>
          <VStack gap={4}>
            <VStack gap={2}>
              <HStack gap={2} align="center">
                <Download className="w-5 h-5 text-primary" />
                <Text weight="bold" className="text-xl">Export My Data</Text>
              </HStack>
              <Text type="supporting" className="text-sm">
                Download a complete copy of all your personal data, applications, and logs stored on our servers.
              </Text>
            </VStack>
            
            <Text className="text-sm text-muted-foreground border-t border-border pt-4">
              The data will be provided in JSON format, which is machine-readable and portable.
            </Text>
            
            <div className="mt-2">
              <Button 
                variant="ghost" 
                onClick={handleExportData} 
                isDisabled={loadingExport}
                label={loadingExport ? "Preparing Export..." : "Request Data Export"}
              />
            </div>
          </VStack>
        </Card>

        <Card padding={6} className="border-red-500/50 bg-red-500/5">
          <VStack gap={4}>
            <VStack gap={2}>
              <HStack gap={2} align="center" className="text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <Text weight="bold" className="text-xl">Delete Account</Text>
              </HStack>
              <Text type="supporting" className="text-sm">
                Permanently delete your account and all associated data. This action is irreversible.
              </Text>
            </VStack>
            
            <Text className="text-sm text-muted-foreground border-t border-border pt-4">
              Once deleted, your profile, applications, and settings will be removed from our active database within 30 days.
            </Text>
            
            <div className="mt-2">
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount} 
                isDisabled={loadingDelete}
                label={loadingDelete ? "Deleting..." : "Delete Account"}
                icon={<Trash2 className="w-4 h-4" />}
              />
            </div>
          </VStack>
        </Card>
      </div>
    </div>
  );
}
