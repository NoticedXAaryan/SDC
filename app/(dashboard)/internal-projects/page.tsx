import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ProjectsClient from "./projects-client";
import { PageHeader } from "@/components/astryx/page-header";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireSession();
  
  const allProjects = await db.query.projects.findMany({
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
          title="Projects Kanban" 
          description="Manage internal and club projects."
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <ProjectsClient initialProjects={allProjects as any} />
      </div>
    </div>
  );
}
