import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { researchPapers, competitions, achievementSubmissions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { SubmitAchievementDialog } from "@/components/achievements/submit-achievement-dialog";

export default async function AchievementsPage() {
  const session = await requireSession();

  const papers = await db.select().from(researchPapers).orderBy(desc(researchPapers.createdAt));
  const wins = await db.select().from(competitions).orderBy(desc(competitions.createdAt));
  const submissions = await db.select().from(achievementSubmissions)
    .where(eq(achievementSubmissions.userId, session.user.id))
    .orderBy(desc(achievementSubmissions.createdAt));

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <PageHeader
        title="Hall of Fame & Achievements"
        description="Submit your achievements to earn points and climb the leaderboard."
        primaryAction={<SubmitAchievementDialog />}
      />

      <VStack gap={4}>
        <Text weight="bold" className="text-2xl">My Submissions</Text>
        {submissions.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="You haven't submitted any achievements yet. Click the button above to submit your first achievement."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map(sub => (
              <Card key={sub.id}>
                <VStack gap={3}>
                  <HStack justify="between" align="start">
                    <VStack gap={1}>
                      <Text weight="semibold" className="text-lg">{sub.title}</Text>
                      <Text type="supporting" className="text-xs">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </Text>
                    </VStack>
                    <Badge 
                      variant={sub.status === "approved" ? "success" : sub.status === "rejected" ? "error" : "neutral"}
                      label={(sub.status || "pending").replace(/_/g, " ")}
                    />
                  </HStack>
                  <Text type="supporting" className="text-sm line-clamp-3 min-h-[60px]">
                    {sub.description}
                  </Text>
                  <HStack justify="between" align="center" className="pt-2 border-t border-border">
                    {sub.proofUrl ? (
                      <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline">
                        View Proof
                      </a>
                    ) : (
                      <Text type="supporting" className="text-sm italic">No proof attached</Text>
                    )}
                    <Text weight="bold" className="text-green-600">+{sub.pointsAwarded || 0} pts</Text>
                  </HStack>
                </VStack>
              </Card>
            ))}
          </div>
        )}
      </VStack>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <VStack gap={4}>
          <Text weight="bold" className="text-2xl">Research Papers</Text>
          {papers.length === 0 ? (
            <EmptyState
              title="No papers"
              description="No research papers published yet."
            />
          ) : (
            <VStack gap={3}>
              {papers.map(p => (
                <Card key={p.id}>
                  <VStack gap={2}>
                    <Text weight="semibold" className="text-lg">{p.title}</Text>
                    <Text type="supporting" className="text-sm">Authors: {p.authors}</Text>
                    {p.url && (
                      <a href={p.url} className="text-blue-500 text-sm hover:underline" target="_blank" rel="noopener noreferrer">
                        Read Paper
                      </a>
                    )}
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>

        <VStack gap={4}>
          <Text weight="bold" className="text-2xl">Competition Wins</Text>
          {wins.length === 0 ? (
            <EmptyState
              title="No wins"
              description="No competition wins yet."
            />
          ) : (
            <VStack gap={3}>
              {wins.map(w => (
                <Card key={w.id}>
                  <VStack gap={2}>
                    <Text weight="semibold" className="text-lg">{w.title}</Text>
                    <Text weight="medium" className="text-sm text-green-600">Position: {w.position}</Text>
                    {w.url && (
                      <a href={w.url} className="text-blue-500 text-sm hover:underline" target="_blank" rel="noopener noreferrer">
                        View Details
                      </a>
                    )}
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </div>
    </div>
  );
}
