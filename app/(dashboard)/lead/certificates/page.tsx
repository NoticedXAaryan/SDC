import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates, events } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, Button, HStack, VStack, Text, Heading } from "@astryxdesign/core";
import { PageHeader } from "@/components/astryx/page-header";
import Link from "next/link";
import { CreateTemplateDialog } from "@/components/certificates/create-template-dialog";
import { IssueCertificateDialog } from "@/components/certificates/issue-certificate-dialog";

export default async function CertificatesDashboardPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const templates = await db.select().from(certTemplates)
    .orderBy(desc(certTemplates.createdAt));
  const recentEvents = await db.select({ id: events.id, title: events.title }).from(events).orderBy(desc(events.createdAt)).limit(20);

  return (
    <VStack gap={6} className="max-w-4xl mx-auto py-8 w-full">
      <HStack justify="between" className="w-full">
        <PageHeader title="Certificates & Templates" />
        <CreateTemplateDialog />
      </HStack>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="flex flex-col p-4 gap-4">
            <VStack gap={1}>
              <Heading level={4} className="truncate">{template.name}</Heading>
              <Text type="supporting" className="text-sm">
                Created on {template.createdAt && !isNaN(new Date(template.createdAt).getTime()) 
                  ? new Date(template.createdAt).toLocaleDateString() 
                  : 'Unknown date'}
              </Text>
            </VStack>
            
            <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border">
              <iframe src={`${template.backgroundUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 pointer-events-none" />
            </div>
            
            <HStack gap={2} justify="between" className="mt-auto pt-2">
              <Link href={`/lead/certificates/templates/${template.id}/edit`} className="flex-1">
                <Button variant="secondary" label="Edit Design" className="w-full" />
              </Link>
              <IssueCertificateDialog 
                templateId={template.id} 
                templateName={template.name}
                events={recentEvents}
              />
            </HStack>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed rounded-lg">
            <VStack gap={4} align="center" className="mx-auto max-w-[420px]">
              <Heading level={3}>No templates created</Heading>
              <Text type="supporting" className="text-sm">
                You haven't created any certificate templates yet. Upload a base PDF to get started.
              </Text>
              <CreateTemplateDialog />
            </VStack>
          </div>
        )}
      </div>
    </VStack>
  );
}
