import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates, events } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CertificateAdminPage() {
  await requireAdmin();

  const templates = await db.select({
    template: certTemplates,
    event: events
  })
  .from(certTemplates)
  .leftJoin(events, eq(certTemplates.eventId, events.id))
  .orderBy(desc(certTemplates.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certificate Templates</h1>
          <p className="text-muted-foreground">Manage templates for event certificates.</p>
        </div>
        <Button asChild>
          <Link href="/admin/certificates/create">
            <Plus className="w-4 h-4 mr-2" /> New Template
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(({ template, event }) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>
                {event ? `Linked to: ${event.title}` : "No event linked"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-md mb-4 flex items-center justify-center overflow-hidden">
                {template.backgroundUrl ? (
                  <img src={template.backgroundUrl} alt="Template bg" className="object-cover w-full h-full" />
                ) : (
                  <span className="text-muted-foreground text-sm">No background</span>
                )}
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/admin/certificates/${template.id}`}>Edit Template</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {templates.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground border rounded-lg">
            No templates created yet.
          </div>
        )}
      </div>
    </div>
  );
}
