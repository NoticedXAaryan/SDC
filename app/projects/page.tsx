import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { EmptyState } from "@/components/astryx/empty-state";
import Link from "next/link";
import { Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const allProjects = await db.query.projects.findMany({
    where: eq(projects.status, "approved"),
    orderBy: [desc(projects.createdAt)],
    with: {
      images: true,
    }
  });

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Featured Projects</h1>
          <p className="text-xl text-muted-foreground">Discover amazing things built by our community.</p>
        </div>
        <div>
          <Link href="/projects/submit" passHref legacyBehavior>
            <Button variant="primary" label="Submit a Project" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
        {allProjects.map(project => {
          const images = project.images?.map(img => img.url) || [];
          return (
            <Card key={project.id} padding={0} className="overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow border-border">
              {images.length > 0 ? (
                <div className="aspect-video bg-muted relative">
                  <img src={images[0]} alt={project.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video bg-blue-50 flex items-center justify-center">
                  <span className="text-blue-200 text-4xl font-bold">{project.title.charAt(0)}</span>
                </div>
              )}
              
              <VStack gap={4} className="p-6 flex-1">
                <VStack gap={2}>
                  <Text weight="bold" className="text-xl">{project.title}</Text>
                  <Text type="supporting" className="line-clamp-2 text-sm">{project.description}</Text>
                </VStack>
              </VStack>
              
              <div className="flex justify-between border-t border-border p-4 bg-muted/10">
                <div className="flex gap-2">
                  {project.liveUrl && (
                    <Link href={project.liveUrl} target="_blank" passHref legacyBehavior>
                      <Button variant="ghost" label="Live Demo" icon={<Globe className="w-4 h-4" />} />
                    </Link>
                  )}
                </div>
                <Link href={`/projects/${project.id}`} passHref legacyBehavior>
                  <Button variant="secondary" label="View Details" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
      
      {allProjects.length === 0 && (
        <EmptyState 
          title="No projects featured yet" 
          description="Check back later for amazing community projects."
        />
      )}
    </div>
  );
}
