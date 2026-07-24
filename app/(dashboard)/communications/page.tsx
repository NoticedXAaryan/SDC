import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Bell } from "lucide-react";
import { Button } from "@astryxdesign/core/Button";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await requireSession();
  const canSend = isManagementRole(session.user.role as string);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Communications"
        description="Updates, announcements, and messages from the club."
        primaryAction={canSend ? (
          <Button variant="primary" label="New Announcement" icon={<Bell className="w-4 h-4" />} />
        ) : undefined}
      />

      <EmptyState
        title="No messages"
        description="You're all caught up! New announcements will appear here."
      />
    </div>
  );
}
