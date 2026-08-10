"use client";

import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/astryx/empty-state";
import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";

export function ResearchList() {
  const [papers, setPapers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/research")
      .then((res) => res.json())
      .then((data) => {
        setPapers(Array.isArray(data.papers) ? data.papers : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} padding={4}>
            <Skeleton className="h-6 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (papers.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen />}
        title="No research papers"
        description="No published research papers have been submitted yet."
      />
    );
  }

  return (
    <div className="space-y-4">
      {papers.map((paper) => (
        <Card key={paper.id} padding={4}>
          <HStack justify="between" align="start">
            <VStack gap={1}>
              <Text weight="bold" className="text-lg">{paper.title}</Text>
              <Text type="supporting" className="text-sm">Authors: {paper.authors}</Text>
              <HStack gap={4} className="mt-2 text-xs text-muted-foreground">
                {paper.publishedAt && <span>Published: {new Date(paper.publishedAt).toLocaleDateString()}</span>}
              </HStack>
              {paper.url && (
                <Link href={paper.url} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  Read Paper <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </VStack>
            {paper.status && (
              <Badge label={paper.status} variant={paper.status === "approved" ? "success" : "neutral"} />
            )}
          </HStack>
        </Card>
      ))}
    </div>
  );
}
