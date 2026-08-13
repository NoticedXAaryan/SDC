import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates, events } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CertificateAdminPage() {
  await requireRole(["admin", "owner", "tech_lead", "lead", "event_lead"]);

  const templates = await db.select({
    template: certTemplates,
    event: events
  })
  .from(certTemplates)
  .leftJoin(events, eq(certTemplates.eventId, events.id))
  .orderBy(desc(certTemplates.createdAt));

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <PageHeader 
        title="Certificate Templates" 
        description="Manage templates for event certificates."
        primaryAction={
          <Link href="/admin/certificates/create" passHref legacyBehavior>
            <Button as="a" variant="primary" label="New Template" icon={<Plus className="w-4 h-4" />} />
          </Link>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          title="No templates created"
          description="Create your first certificate template for an event."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(({ template, event }) => (
            <Card key={template.id} padding={0} className="overflow-hidden flex flex-col">
              <div className="p-4 flex flex-col gap-1 border-b border-border">
                <Text weight="semibold" className="text-lg line-clamp-1">{template.name}</Text>
                <Text type="supporting" className="text-sm line-clamp-1">
                  {event ? `Linked to: ${event.title}` : "No event linked"}
                </Text>
              </div>
              
              <div className="aspect-video bg-muted relative">
                {template.backgroundUrl ? (
                  <img src={template.backgroundUrl} alt="Template bg" className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                    <Text type="supporting">No background</Text>
                  </div>
                )}
              </div>
              
              <div className="p-4 mt-auto border-t border-border bg-muted/10">
                <Link href={`/admin/certificates/${template.id}`} passHref legacyBehavior>
                  <Button as="a" variant="ghost" label="Edit Template" className="w-full justify-center" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
