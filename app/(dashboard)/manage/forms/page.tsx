"use client";

import { useEffect, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Plus, Copy, Trash, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/astryx/toast-provider";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type ManagedForm = {
  id: string;
  title: string;
  status: string;
  responseCount: number;
};

export default function ManageFormsPage() {
  const [forms, setForms] = useState<ManagedForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingForm, setDeletingForm] = useState<ManagedForm | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Forms could not be loaded");
      setForms(data);
    } catch (loadError) {
      error(loadError instanceof Error ? loadError.message : "Forms could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const createForm = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled form", fields: [] }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to create form");
      router.push(`/manage/forms/${data.id}/edit`);
    } catch (createError) {
      error(createError instanceof Error ? createError.message : "Failed to create form");
    } finally {
      setCreating(false);
    }
  };

  const deleteForm = async () => {
    if (!deletingForm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/forms/${deletingForm.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to delete form");
      setForms((current) => current.filter((form) => form.id !== deletingForm.id));
      success("Form deleted");
      setDeletingForm(null);
    } catch (deleteError) {
      error(deleteError instanceof Error ? deleteError.message : "Failed to delete form");
    } finally {
      setDeleting(false);
    }
  };

  const copyShareLink = async (id: string) => {
    const url = `${window.location.origin}/forms/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      success("Share link copied to clipboard");
    } catch {
      error("The link could not be copied. Open the form and copy it from the address bar.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Forms" 
        description="Create and manage custom forms"
        primaryAction={
          <Button onClick={createForm} icon={<Plus className="h-4 w-4" />} label={creating ? "Creating…" : "Create Form"} variant="primary" isDisabled={creating} />
        }
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} padding={4}>
              <VStack gap={4}>
                <HStack justify="between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </HStack>
                <Skeleton className="h-4 w-24" />
                <HStack gap={2} className="mt-4">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </HStack>
              </VStack>
            </Card>
          ))}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms created yet"
          description="Create your first form to start collecting responses."
          action={<Button onClick={createForm} icon={<Plus className="h-4 w-4" />} label={creating ? "Creating…" : "Create Form"} isDisabled={creating} />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} padding={4}>
              <VStack gap={4}>
                <HStack justify="between" align="center">
                  <Text weight="bold" className="truncate flex-1 pr-2">{form.title}</Text>
                  <Badge 
                    variant={form.status === 'published' ? 'success' : 'neutral'} 
                    label={form.status} 
                  />
                </HStack>
                
                <Text type="supporting" className="text-sm">
                  {form.responseCount} response{form.responseCount === 1 ? "" : "s"}
                </Text>

                <HStack gap={2} className="mt-2">
                  <Button 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => router.push(`/manage/forms/${form.id}/edit`)}
                    icon={<FileText className="h-4 w-4" />}
                    label="Edit"
                  />
                  <Button 
                    variant="secondary" 
                    onClick={() => void copyShareLink(form.id)}
                    icon={<Copy className="h-4 w-4" />}
                    aria-label="Copy Link"
                    label="Copy"
                  />
                  <Button 
                    variant="destructive" 
                    onClick={() => setDeletingForm(form)}
                    icon={<Trash className="h-4 w-4" />}
                    aria-label="Delete Form"
                    label="Delete"
                  />
                </HStack>
              </VStack>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deletingForm)} onOpenChange={(open) => !open && setDeletingForm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingForm?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the form and all responses collected through it. Export anything you need before continuing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep form</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void deleteForm();
              }}
            >
              {deleting ? "Deleting…" : "Delete form"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
