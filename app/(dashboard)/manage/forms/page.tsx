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

export default function ManageFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { success, error } = useToast();

  const fetchForms = async () => {
    try {
      const res = await fetch("/api/forms");
      if (res.ok) {
        setForms(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const createForm = async () => {
    const res = await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Form", fields: [] }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/manage/forms/${data.id}/edit`);
    } else {
      error("Failed to create form");
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) {
      setForms(forms.filter((f) => f.id !== id));
      success("Form deleted");
    }
  };

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/forms/${id}`;
    navigator.clipboard.writeText(url);
    success("Share link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Forms" 
        description="Create and manage custom forms"
        primaryAction={
          <Button onClick={createForm} icon={<Plus className="h-4 w-4" />} label="Create Form" variant="primary" />
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
          action={<Button onClick={createForm} icon={<Plus className="h-4 w-4" />} label="Create Form" />}
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
                  0 responses
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
                    onClick={() => copyShareLink(form.id)}
                    icon={<Copy className="h-4 w-4" />}
                    aria-label="Copy Link"
                    label="Copy"
                  />
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteForm(form.id)}
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
    </div>
  );
}
