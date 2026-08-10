import { requireRole } from "@/lib/dal/auth";
import { PageHeader } from "@/components/astryx/page-header";
import { TaskList } from "./components/task-list";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  await requireRole(["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Tasks & Assignments"
        description="Manage internal club tasks and event checklists."
      />

      <TaskList />
    </div>
  );
}
