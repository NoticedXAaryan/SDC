import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { desc, eq, or } from "drizzle-orm";
import ProjectsClient from "./projects-client";
import { PageHeader } from "@/components/astryx/page-header";
import { PROJECT_DELETE_ROLES, PROJECT_REVIEW_ROLES } from "@/lib/domain/projects";
import { SubmitProjectDialog } from "./submit-project-dialog";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await requireSession();
  const role = session.user.role as string;
  const canReview = (PROJECT_REVIEW_ROLES as readonly string[]).includes(role);
  const canDelete = (PROJECT_DELETE_ROLES as readonly string[]).includes(role);
  
  const allProjects = await db.query.projects.findMany({
    where: canReview ? undefined : or(eq(projects.status, "approved"), eq(projects.submittedBy, session.user.id)),
    orderBy: [desc(projects.createdAt)],
    with: {
      images: true,
      teamMembers: true,
    }
  });

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto h-[calc(100vh-80px)] overflow-hidden flex flex-col">
      <div className="shrink-0">
        <PageHeader 
          title="Club Projects"
          description="Submit work for review and explore projects published by the club."
          primaryAction={<SubmitProjectDialog />}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <ProjectsClient initialProjects={allProjects} canReview={canReview} canDelete={canDelete} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
