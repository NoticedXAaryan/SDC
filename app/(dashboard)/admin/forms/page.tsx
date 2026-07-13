import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { formTemplates } from "@/lib/db/schema";
import FormBuilderClient from "./components/form-builder-client";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function FormsAdminPage() {
  await requireAdmin();

  const templates = await db.select().from(formTemplates).orderBy(desc(formTemplates.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Form Templates</h1>
        <p className="text-muted-foreground">Manage dynamic application forms (Google Forms style).</p>
      </div>
      <FormBuilderClient initialTemplates={templates as any} />
    </div>
  );
}
