import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { CertificateDesigner } from "@/components/certificates/designer";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminCertificateDesignerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["admin", "owner", "tech_lead", "lead", "event_lead"]);

  const template = await db.query.certTemplates.findFirst({
    where: eq(certTemplates.id, id),
  });
  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit {template.name}</h1>
        <p className="text-sm text-muted-foreground">Place and configure fields using the certificate designer.</p>
      </div>
      <CertificateDesigner
        initialTemplate={{ basePdf: template.backgroundUrl, schemas: template.fields }}
        templateId={template.id}
      />
    </div>
  );
}
