import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { PageHeader } from "@/components/app/page-header";
import { EmptyState } from "@/components/app/empty-state";
import { MessageSquare, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const session = await requireSession();
  const canSend = isManagementRole(session.user.role as string);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Communications"
        description="Updates, announcements, and messages from the club."
        primaryAction={canSend ? (
          <Button>
            <Bell className="w-4 h-4 mr-2" /> New Announcement
          </Button>
        ) : undefined}
      />

      <EmptyState
        icon={MessageSquare}
        title="No messages"
        description="You're all caught up! New announcements will appear here."
      />
    </div>
  );
}
