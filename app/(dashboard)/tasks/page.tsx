import { requireSession } from "@/lib/dal/auth";
import { getTasks } from "@/lib/dal/tasks";
import { PageHeader } from "@/components/astryx/page-header";
import { TaskBoard } from "./task-board";

export default async function TasksPage() {
  const session = await requireSession();
  const tasks: any = await getTasks(session);
  const userRole = session.user.role as string;
  const isLead = ["lead", "admin", "owner", "tech_lead", "event_lead", "marketing_lead", "finance_lead", "content_lead", "vice_lead", "co_lead"].includes(userRole);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader 
        title="Task Board" 
        description="Manage your tasks and track team progress." 
      />
      <TaskBoard initialTasks={tasks} isLead={isLead} />
    </div>
  );
}
