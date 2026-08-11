import { db } from "@/lib/db";
import { researchPapers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, Heading, Text, VStack, Button, HStack, Badge } from "@astryxdesign/core";
import { ExternalLink, BookOpen, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResearchPage() {
  const papers = await db
    .select()
    .from(researchPapers)
    .where(eq(researchPapers.status, "approved"))
    .orderBy(researchPapers.createdAt); // We might want to sort by publishedAt if available

  return (
    <div className="container max-w-5xl py-12 space-y-8">
      <div className="flex flex-col space-y-4">
        <HStack align="center" gap={3}>
          <BookOpen className="w-8 h-8 text-primary" />
          <Heading level={1}>Research Publications</Heading>
        </HStack>
        <Text type="supporting" className="text-lg">
          Explore the research papers and publications authored by members of the Student Developer Club.
        </Text>
      </div>

      {papers.length === 0 ? (
        <Card padding={8} className="text-center">
          <VStack align="center" gap={4}>
            <div className="bg-muted p-4 rounded-full">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <Heading level={3}>No publications yet</Heading>
            <Text type="supporting">
              We haven't published any research papers yet. Check back soon!
            </Text>
          </VStack>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {papers.map((paper) => (
            <Card key={paper.id} padding={6}>
              <VStack gap={4} className="h-full justify-between">
                <VStack gap={2}>
                  <Heading level={4} className="line-clamp-2">{paper.title}</Heading>
                  <Text type="supporting" className="text-sm">By {paper.authors}</Text>
                </VStack>
                
                <HStack justify="between" align="center" className="pt-4 border-t">
                  <Text type="supporting" className="text-xs">
                    {paper.publishedAt 
                      ? new Date(paper.publishedAt).toLocaleDateString()
                      : new Date(paper.createdAt).toLocaleDateString()}
                  </Text>
                  
                  {paper.url && (
                    <Button 
                      href={paper.url} 
                      target="_blank"
                      variant="secondary" 
                      size="sm" 
                      label="Read Paper" 
                      icon={<ExternalLink className="w-4 h-4" />} 
                    />
                  )}
                </HStack>
              </VStack>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
