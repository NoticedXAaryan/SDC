import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Globe, User, ExternalLink } from "lucide-react";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const projectRows = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  const project = projectRows[0];
  
  if (!project) {
    notFound();
  }

  const teamMembers = project.teamMembers as Array<{ name: string; role: string; github?: string; twitter?: string }> || [];
  const images = project.images as string[] || [];

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">{project.title}</h1>
        <p className="text-xl text-muted-foreground">{project.description}</p>
        
        <div className="flex justify-center gap-4 pt-4">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline"><Globe className="mr-2 h-4 w-4" /> Repository</Button>
            </a>
          )}
          {project.liveUrl && (
            <Link href={project.liveUrl} target="_blank" className={cn(buttonVariants({ variant: "outline" }))}>
              <ExternalLink className="mr-2 w-4 h-4" /> Live Demo
            </Link>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="rounded-xl overflow-hidden shadow-lg border">
          <img src={images[0]} alt={project.title} className="w-full h-auto object-cover" />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
          <CardDescription>The builders behind this project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <div className="flex gap-2">
                  {member.github && (
                    <Link href={`https://github.com/${member.github}`} target="_blank" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
