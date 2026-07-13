import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const allProjects = await db.select().from(projects).where(eq(projects.status, "approved")).orderBy(desc(projects.createdAt));

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Featured Projects</h1>
          <p className="text-xl text-muted-foreground">Discover amazing things built by our community.</p>
        </div>
        <div>
          <Link href="/projects/submit" className={cn(buttonVariants({ size: "lg" }))}>
            Submit a Project
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        {allProjects.map(project => {
          const images = project.images as string[] || [];
          return (
            <Card key={project.id} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow">
              {images.length > 0 ? (
                <div className="aspect-video bg-muted relative">
                  <img src={images[0]} alt={project.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-200 text-4xl font-bold">{project.title.charAt(0)}</span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {/* Additional content could go here */}
              </CardContent>
              <CardFooter className="flex justify-between border-t p-4 bg-gray-50/50">
                <div className="flex gap-2">
                  {project.liveUrl && (
                    <Link href={project.liveUrl} target="_blank" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
                      <Globe className="w-4 h-4" />
                    </Link>
                  )}
                </div>
                <Link href={`/projects/${project.id}`} className={cn(buttonVariants({ variant: "outline" }))}>View Details</Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
      
      {allProjects.length === 0 && (
        <div className="text-center p-12 bg-muted/50 rounded-lg border border-dashed">
          <p className="text-muted-foreground">No projects have been featured yet.</p>
        </div>
      )}
    </div>
  );
}
