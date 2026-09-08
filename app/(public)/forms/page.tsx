import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { forms, formResponses } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function PublicFormsPage() {
  const availableForms = await db.select({
    id: forms.id,
    title: forms.title,
    description: forms.description,
    responseCount: sql<number>`count(${formResponses.id})`.mapWith(Number),
  })
    .from(forms)
    .leftJoin(formResponses, eq(formResponses.formId, forms.id))
    .where(eq(forms.status, "published"))
    .groupBy(forms.id)
    .orderBy(sql`${forms.createdAt} DESC`);

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Club Home
        </Link>
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Club workflows</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Open forms</h1>
          <p className="mt-2 text-muted-foreground">Applications, event feedback, and requests currently accepting responses.</p>
        </div>

        {availableForms.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <FileText className="mx-auto h-9 w-9 text-muted-foreground/50" aria-hidden="true" />
            <h2 className="mt-4 font-medium">No forms are open</h2>
            <p className="mt-1 text-sm text-muted-foreground">Published forms will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableForms.map((form) => (
              <Link key={form.id} href={`/forms/${form.id}`} className="group rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="mt-4 font-semibold group-hover:text-primary">{form.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{form.description || "Open this form to provide your response."}</p>
                <p className="mt-5 text-xs text-muted-foreground">{form.responseCount} response{form.responseCount === 1 ? "" : "s"}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
