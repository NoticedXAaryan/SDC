import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates, events } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CreateTemplateDialog } from "@/components/certificates/create-template-dialog";
import { IssueCertificateDialog } from "@/components/certificates/issue-certificate-dialog";
import { canDesignCertificates, canIssueCertificates } from "@/lib/domain/certificate";
import { Badge } from "@/components/ui/badge";

export default async function CertificatesDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const session = await requireSession();
  const { eventId } = await searchParams;
  const userRole = session.user.role || "member";
  if (!canDesignCertificates(userRole as string)) {
    redirect("/");
  }

  const [templates, recentEvents, linkedEvent] = await Promise.all([
    db.select().from(certTemplates).orderBy(desc(certTemplates.createdAt)),
    db.select({ id: events.id, title: events.title }).from(events).orderBy(desc(events.createdAt)).limit(20),
    eventId
      ? db.query.events.findFirst({ where: eq(events.id, eventId) })
      : Promise.resolve(undefined),
  ]);
  const attachedTemplate = linkedEvent?.certificateTemplateId
    ? templates.find((template) => template.id === linkedEvent.certificateTemplateId)
    : undefined;
  const canIssue = canIssueCertificates(userRole as string);

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificates & templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Design once, attach it to an event, then issue only to verified attendees.
          </p>
        </div>
        {linkedEvent && !attachedTemplate ? (
          <CreateTemplateDialog event={{ id: linkedEvent.id, title: linkedEvent.title }} />
        ) : (
          <CreateTemplateDialog />
        )}
      </div>

      {linkedEvent ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex-row items-start justify-between gap-4">
            <div>
              <CardDescription>Event workflow</CardDescription>
              <CardTitle className="mt-1">{linkedEvent.title}</CardTitle>
            </div>
            <Badge variant={attachedTemplate ? "default" : "secondary"}>
              {attachedTemplate ? "Template attached" : "Design needed"}
            </Badge>
          </CardHeader>
          {attachedTemplate ? (
            <CardFooter>
              <Link
                href={`/lead/certificates/templates/${attachedTemplate.id}/edit`}
                className={cn(buttonVariants({ size: "sm" }), "w-full sm:w-auto")}
              >
                Continue event design
              </Link>
            </CardFooter>
          ) : null}
        </Card>
      ) : null}

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
                <iframe src={`${template.backgroundUrl}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-0 pointer-events-none" />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 justify-between">
              <Link 
                href={`/lead/certificates/templates/${template.id}/edit`} 
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
              >
                Edit Design
              </Link>
              {canIssue ? (
                <IssueCertificateDialog
                  templateId={template.id}
                  templateName={template.name}
                  events={recentEvents}
                />
              ) : null}
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
