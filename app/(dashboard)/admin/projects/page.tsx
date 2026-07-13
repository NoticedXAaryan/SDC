import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProjectApprovalList } from "./components/project-approval-list";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  await requireRole(["admin", "owner", "tech_lead", "co_lead"]);
  
  const pendingProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.status, "pending"))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Project Submissions</h1>
        <p className="text-muted-foreground">Review and approve community projects.</p>
      </div>

      <ProjectApprovalList initialProjects={pendingProjects} />
    </div>
  );
}
