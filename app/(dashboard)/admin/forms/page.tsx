import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { forms, formFields } from "@/lib/db/schema";
import FormBuilderClient from "./components/form-builder-client";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";

export const dynamic = "force-dynamic";

export default async function FormsAdminPage() {
  await requireRole(["admin", "owner", "tech_lead", "lead"]);

  // Fetch all forms with their fields
  const allForms = await db.select().from(forms).orderBy(desc(forms.createdAt));
  const allFields = await db.select().from(formFields).orderBy(formFields.order);
  
  const formsWithFields = allForms.map(f => ({
    ...f,
    fields: allFields.filter(field => field.formId === f.id)
  }));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Form Templates" 
        description="Manage dynamic application forms."
      />
      
      <FormBuilderClient initialTemplates={formsWithFields as any} />
    </div>
  );
}
