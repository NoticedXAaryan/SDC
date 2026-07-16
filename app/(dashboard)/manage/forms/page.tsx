"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, Copy, Trash, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ManageFormsPage() {
  const [forms, setForms] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    const res = await fetch("/api/forms");
    if (res.ok) {
      setForms(await res.json());
    }
  };

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
      toast.error("Failed to create form");
    }
  };

  const deleteForm = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/forms/${id}`, { method: "DELETE" });
    if (res.ok) {
      setForms(forms.filter((f) => f.id !== id));
      toast.success("Form deleted");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Forms</h2>
          <p className="text-muted-foreground">Create and manage custom forms</p>
        </div>
        <Button onClick={createForm}><Plus className="mr-2 h-4 w-4" /> Create Form</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map((form) => (
          <Card key={form.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span className="truncate">{form.title}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${form.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {form.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm" asChild className="flex-1">
                  <Link href={`/manage/forms/${form.id}/edit`}><FileText className="mr-2 h-4 w-4" /> Edit</Link>
                </Button>
                <Button variant="outline" size="icon" onClick={() => deleteForm(form.id)}>
                  <Trash className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {forms.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
            No forms created yet. Click "Create Form" to get started.
          </div>
        )}
      </div>
    </div>
  );
}
