import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certificateTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { CertificateDesigner } from "@/components/certificates/designer-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TemplateDesignerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const templateRows = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, id)).limit(1);
  const template = templateRows[0];

  if (!template) {
    notFound();
  }

  // Convert DB row format back to what pdfme expects
  const pdfmeTemplate = {
    basePdf: template.basePdf,
    schemas: template.schemas as any,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Template: {template.name}</CardTitle>
          <CardDescription>Use the designer to customize the certificate layout</CardDescription>
        </CardHeader>
        <CardContent>
          <CertificateDesigner 
            initialTemplate={pdfmeTemplate} 
            templateId={template.id} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
