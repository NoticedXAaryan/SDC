"use client";

import { useEffect, useState } from "react";
import { FileText, Plus, Eye, BarChart3, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Form } from "@/lib/types";

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/forms")
      .then((r) => r.json())
      .then((d) => setForms(d.forms || d || []))
      .catch(() => {
        toast.error("Failed to load forms");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pt-8 md:pt-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forms</h1>
          <p className="text-sm text-muted-foreground">View and fill out club forms for events and feedback.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : Array.isArray(forms) && forms.length > 0 ? (
          forms.map((form, i) => (
            <div key={form.id || i} className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  form.status === "published" 
                    ? "bg-emerald-500/10 text-emerald-500" 
                    : "bg-muted text-muted-foreground"
                }`}>
                  {form.status || "draft"}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-foreground">{form.title || "Untitled Form"}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{form.description || "No description"}</p>
              <div className="mt-3 flex gap-2">
                {form.status === "published" && (
                  <button 
                    onClick={() => router.push(`/forms/${form.id}`)} 
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Fill Out
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center py-12">
            <FileText className="mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-foreground">No forms available</p>
            <p className="mt-1 text-xs text-muted-foreground">Published forms will appear here for you to fill out.</p>
          </div>
        )}
      </div>
    </div>
  );
}
