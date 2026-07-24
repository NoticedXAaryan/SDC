import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import ProjectsClient from "./projects-client";
import { PageHeader } from "@/components/astryx/page-header";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  await requireSession();
  
  const allProjects = await db.select({
    id: projects.id,
    title: projects.title,
    description: projects.description,
    status: projects.status,
    githubUrl: projects.githubUrl,
    liveUrl: projects.liveUrl,
    images: projects.images,
  })
  .from(projects)
  .orderBy(desc(projects.createdAt));

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
