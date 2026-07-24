import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Avatar } from "@astryxdesign/core/Avatar";
import Link from "next/link";
import { Globe, ExternalLink } from "lucide-react";

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
      <VStack gap={4} className="text-center">
        <h1 className="text-4xl font-bold">{project.title}</h1>
        <p className="text-xl text-muted-foreground">{project.description}</p>
        
        <HStack gap={4} justify="center" className="pt-4">
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" label="Repository" icon={<Globe className="h-4 w-4" />} />
            </a>
          )}
          {project.liveUrl && (
            <Link href={project.liveUrl} target="_blank" passHref legacyBehavior>
              <Button variant="secondary" label="Live Demo" icon={<ExternalLink className="w-4 h-4" />} />
            </Link>
          )}
        </HStack>
      </VStack>

      {images.length > 0 && (
        <div className="rounded-xl overflow-hidden shadow-lg border border-border">
          <img src={images[0]} alt={project.title} className="w-full h-auto object-cover" />
        </div>
      )}

      <Card padding={6}>
        <VStack gap={6}>
          <VStack gap={1}>
            <Text weight="bold" className="text-xl">Team</Text>
            <Text type="supporting" className="text-sm">The builders behind this project</Text>
          </VStack>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/10">
                <Avatar name={member.name} size="md" />
                <div className="flex-1">
                  <Text weight="semibold">{member.name}</Text>
                  <Text type="supporting" className="text-sm">{member.role}</Text>
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
        </VStack>
      </Card>
    </div>
  );
}
