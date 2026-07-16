import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { forms, formFields } from "@/lib/db/schema";
import FormBuilderClient from "./components/form-builder-client";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function FormsAdminPage() {
  const session = await requireAdmin();

  // Fetch all forms with their fields
  const allForms = await db.select().from(forms).orderBy(desc(forms.createdAt));
  const allFields = await db.select().from(formFields).orderBy(formFields.order);
  
  const formsWithFields = allForms.map(f => ({
    ...f,
    fields: allFields.filter(field => field.formId === f.id)
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Form Templates</h1>
        <p className="text-muted-foreground">Manage dynamic application forms (Google Forms style).</p>
      </div>
      <FormBuilderClient initialTemplates={formsWithFields as any} />
    </div>
  );
}
