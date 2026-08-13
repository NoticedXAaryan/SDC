import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { ProjectApprovalList } from "./components/project-approval-list";

export const dynamic = "force-dynamic";

export default async function ManageProjectsPage() {
  await requireRole(["admin", "lead", "owner"]);

  const pendingProjects = await db.query.projects.findMany({
    where: eq(projects.status, "pending"),
    orderBy: [desc(projects.createdAt)],
    with: {
      teamMembers: true,
      images: true,
    }
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Project Approvals" 
        description="Review and approve student project submissions to showcase them on the public gallery."
      />
      
      <ProjectApprovalList initialProjects={pendingProjects as any} />
    </div>
  );
}
