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
import { signOut } from "@/lib/auth-client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function CompliancePage() {
  const [loadingExport, setLoadingExport] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
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
    } catch (caughtError) {
      error(caughtError instanceof Error ? caughtError.message : "Your data could not be exported");
    } finally {
      setLoadingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoadingDelete(true);
    try {
      const res = await fetch("/api/compliance/delete", {
        method: "DELETE",
      });
      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.error || "Account could not be deleted");
      
      setConfirmDelete(false);
      success("Account deleted successfully.");
      await signOut().catch(() => undefined);
      router.replace("/");
      router.refresh();
    } catch (caughtError) {
      error(caughtError instanceof Error ? caughtError.message : "Account could not be deleted");
      setLoadingDelete(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PageHeader 
        title="Privacy & Compliance" 
        description="Export your account data or permanently anonymize your account."
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
                Download your profile, applications, registrations, certificates, and inventory activity.
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
                label={loadingExport ? "Preparing Export…" : "Request Data Export"}
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
                Permanently disable sign-in, anonymize your profile, and remove private participation records.
              </Text>
            </VStack>
            
            <Text className="text-sm text-muted-foreground border-t border-border pt-4">
              Operational audit records may be retained against an anonymous user so the club's financial and security history remains intact.
            </Text>
            
            <div className="mt-2">
              <Button 
                variant="destructive" 
                onClick={() => setConfirmDelete(true)}
                isDisabled={loadingDelete}
                label={loadingDelete ? "Deleting…" : "Delete Account"}
                icon={<Trash2 className="w-4 h-4" />}
              />
            </div>
          </VStack>
        </Card>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Sign-in will be disabled, your profile will be anonymized, and private applications, registrations, form responses, certificates, achievements, and stored proof files will be removed. Operational audit history may remain attached to an anonymous user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingDelete}>Keep Account</AlertDialogCancel>
            <AlertDialogAction
              disabled={loadingDelete}
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(event) => { event.preventDefault(); void handleDeleteAccount(); }}
            >
              {loadingDelete ? "Deleting…" : "Delete Account Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
