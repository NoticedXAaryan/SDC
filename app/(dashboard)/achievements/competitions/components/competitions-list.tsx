"use client";

import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Badge } from "@astryxdesign/core/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/astryx/empty-state";
import { Trophy, ExternalLink } from "lucide-react";
import Link from "next/link";

export function CompetitionsList() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/competitions")
      .then((res) => res.json())
      .then((data) => {
        setCompetitions(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} padding={4}>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <EmptyState
        icon={<Trophy />}
        title="No competitions recorded"
        description="Submit your hackathon and competition wins to display them here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {competitions.map((comp) => (
        <Card key={comp.id} padding={4}>
          <HStack justify="between" align="start">
            <VStack gap={1}>
              <Text weight="bold" className="text-lg">{comp.title}</Text>
              <HStack gap={4} className="mt-2 text-xs text-muted-foreground">
                {comp.userName && <span>Submitted by: {comp.userName}</span>}
                {comp.date && <span>Date: {new Date(comp.date).toLocaleDateString()}</span>}
              </HStack>
              {comp.url && (
                <Link href={comp.url} target="_blank" className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  View Project <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </VStack>
            {comp.position && (
              <Badge label={comp.position} variant="success" />
            )}
          </HStack>
        </Card>
      ))}
    </div>
  );
}
