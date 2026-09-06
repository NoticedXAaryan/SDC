import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { FormResponseClient } from "@/components/forms/form-response-client";
import { canDesignForms } from "@/lib/domain/forms";
import { getCurrentUser } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { formFields, forms, user } from "@/lib/db/schema";
import { getAutoFillValue } from "@/lib/forms/autoFill";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getCurrentUser();
  const [form] = await db.select().from(forms).where(eq(forms.id, id)).limit(1);
  if (!form) notFound();

  const canPreview = canDesignForms(session?.user.role as string | undefined);
  if (form.status !== "published" && !canPreview) notFound();

  const settings = form.settings as {
    allowExternal?: boolean;
    requireLogin?: boolean;
    collegeDomainOnly?: boolean;
    autoFillProfile?: boolean;
    thankYouMessage?: string;
    redirectUrl?: string | null;
    theme?: { accentColor?: string };
  };
  if (!session && (settings.requireLogin || !settings.allowExternal || settings.collegeDomainOnly)) {
    redirect(`/login?callbackURL=${encodeURIComponent(`/forms/${id}`)}`);
  }

  const fields = await db.select().from(formFields)
    .where(eq(formFields.formId, id))
    .orderBy(formFields.order);

  let profile: typeof user.$inferSelect | null = null;
  if (session && settings.autoFillProfile) {
    [profile] = await db.select().from(user).where(eq(user.id, session.user.id)).limit(1);
  }
  const initialAnswers = Object.fromEntries(
    fields.flatMap((field) => {
      const value = field.autoFillKey && profile ? getAutoFillValue(profile, field.autoFillKey) : undefined;
      return value === undefined ? [] : [[field.id, field.type === "number" ? Number(value) : value]];
    }),
  );

  return (
    <main className="min-h-screen bg-muted/20 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/forms" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All Forms
        </Link>
        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <header className="border-b p-6 sm:p-8" style={{ borderTop: `4px solid ${settings.theme?.accentColor || "#3b82f6"}` }}>
            <h1 className="text-2xl font-semibold tracking-tight">{form.title}</h1>
            {form.description ? <p className="mt-2 text-sm text-muted-foreground">{form.description}</p> : null}
          </header>
          <div className="p-6 sm:p-8">
            <FormResponseClient
              formId={form.id}
              fields={fields}
              settings={settings}
              initialAnswers={initialAnswers}
              acceptingResponses={form.status === "published"}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
