import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import ProjectsClient from "./projects-client";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects Kanban</h1>
          <p className="text-muted-foreground">Manage internal and club projects.</p>
        </div>
      </div>
      <ProjectsClient initialProjects={allProjects as any} />
    </div>
  );
}
