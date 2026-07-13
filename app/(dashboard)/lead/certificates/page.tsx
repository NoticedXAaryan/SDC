import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certificateTemplates, events } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateTemplateDialog } from "@/components/certificates/create-template-dialog";
import { IssueCertificateDialog } from "@/components/certificates/issue-certificate-dialog";

export default async function CertificatesDashboardPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    redirect("/");
  }

  const templates = await db.select().from(certificateTemplates).orderBy(desc(certificateTemplates.createdAt));
  const recentEvents = await db.select({ id: events.id, title: events.title }).from(events).orderBy(desc(events.createdAt)).limit(20);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Certificates & Templates</h1>
        <CreateTemplateDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="truncate">{template.name}</CardTitle>
              <CardDescription>
                Created on {template.createdAt && !isNaN(new Date(template.createdAt).getTime()) 
                  ? new Date(template.createdAt).toLocaleDateString() 
                  : 'Unknown date'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="aspect-video w-full rounded-md bg-muted flex items-center justify-center overflow-hidden border">
                <iframe src={`${template.basePdf}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full object-cover pointer-events-none" />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-between">
              <Link 
                href={`/lead/certificates/templates/${template.id}/edit`} 
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                Edit Design
              </Link>
              <IssueCertificateDialog 
                templateId={template.id} 
                templateName={template.name}
                events={recentEvents}
              />
            </CardFooter>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed rounded-lg">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">No templates created</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                You haven't created any certificate templates yet. Upload a base PDF to get started.
              </p>
              <CreateTemplateDialog />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
