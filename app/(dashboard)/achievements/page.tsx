import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { researchPapers, competitions, achievementSubmissions, registrations, user } from "@/lib/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { SubmitAchievementDialog } from "@/components/achievements/submit-achievement-dialog";
import { Trophy, Star, Target, Zap, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function AchievementsPage() {
  const session = await requireSession();

  const papers = await db.select().from(researchPapers).orderBy(desc(researchPapers.createdAt));
  const wins = await db.select().from(competitions).orderBy(desc(competitions.createdAt));
  const submissions = await db.select().from(achievementSubmissions)
    .where(eq(achievementSubmissions.userId, session.user.id))
    .orderBy(desc(achievementSubmissions.createdAt));

  // Compute standard achievements
  const [regCount] = await db.select({ count: sql<number>`count(*)` }).from(registrations).where(eq(registrations.userId, session.user.id));
  const [currentUser] = await db.select({ points: user.points, level: user.level }).from(user).where(eq(user.id, session.user.id)).limit(1);
  
  const hasSubmissions = submissions.filter(s => s.status === "approved").length > 0;
  const eventsCount = Number(regCount.count);
  const userPoints = currentUser?.points || 0;
  const userLevel = currentUser?.level || 1;

  const standardAchievements = [
    { title: "First Steps", description: "Registered for your first event.", icon: <Target className="w-8 h-8" />, unlocked: eventsCount >= 1 },
    { title: "Active Member", description: "Registered for 5+ events.", icon: <Zap className="w-8 h-8" />, unlocked: eventsCount >= 5 },
    { title: "Point Collector", description: "Earned over 500 SDC points.", icon: <Star className="w-8 h-8" />, unlocked: userPoints >= 500 },
    { title: "Rising Star", description: "Reached Level 5 in SDC.", icon: <Sparkles className="w-8 h-8" />, unlocked: userLevel >= 5 },
    { title: "Contributor", description: "Got an external achievement approved.", icon: <Shield className="w-8 h-8" />, unlocked: hasSubmissions },
    { title: "Hall of Famer", description: "Got a research paper or competition win.", icon: <Trophy className="w-8 h-8" />, unlocked: false }, // Currently manual
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <PageHeader
        title="Hall of Fame & Achievements"
        description="Submit your achievements to earn points and climb the leaderboard."
        primaryAction={<SubmitAchievementDialog />}
      />

      <VStack gap={4}>
        <Text weight="bold" className="text-2xl">Earned Badges</Text>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {standardAchievements.map((ach, idx) => (
            <Card key={idx} className={cn("text-center relative overflow-hidden transition-all duration-300", ach.unlocked ? "border-yellow-500/50 bg-yellow-500/5 shadow-lg shadow-yellow-500/10" : "opacity-60 grayscale bg-muted/30 border-dashed")}>
              <VStack align="center" gap={3} className="p-4">
                <div className={cn("p-3 rounded-full", ach.unlocked ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground")}>
                  {ach.icon}
                </div>
                <VStack gap={1}>
                  <Text weight="semibold" className="text-sm">{ach.title}</Text>
                </VStack>
              </VStack>
            </Card>
          ))}
        </div>
      </VStack>

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
