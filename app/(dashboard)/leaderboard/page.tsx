import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Avatar } from "@astryxdesign/core/Avatar";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Text } from "@astryxdesign/core/Text";
import { PageHeader } from "@/components/astryx/page-header";

export default async function LeaderboardPage() {
  await requireSession();

  const topUsers = await db.select({
    id: user.id,
    name: user.name,
    image: user.image,
    points: user.points,
    level: user.level,
  })
  .from(user)
  .orderBy(desc(user.points))
  .limit(50);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Global Leaderboard" 
        description="Top contributors and active members based on SDC Points." 
      />

      <Card padding={0} className="overflow-hidden">
        <div className="bg-muted/30 border-b border-border p-4">
          <Text weight="semibold">Top 50 Members</Text>
        </div>
        <div className="divide-y divide-border">
          {topUsers.map((u, index) => (
            <HStack 
              key={u.id} 
              justify="between" 
              align="center" 
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <HStack gap={4} align="center">
                <div className="w-8 text-center">
                  <Text type="supporting" weight="bold" className="text-lg">
                    #{index + 1}
                  </Text>
                </div>
                <Avatar 
                  name={u.name || "User"} 
                  src={u.image || undefined} 
                  size="lg" 
                />
                <VStack gap={0}>
                  <Text weight="semibold">{u.name}</Text>
                  <Text type="supporting">Level {u.level}</Text>
                </VStack>
              </HStack>
              <VStack gap={0} align="end">
                <Text weight="bold" className="text-lg">{u.points || 0}</Text>
                <Text type="supporting" className="text-xs uppercase tracking-wider">Points</Text>
              </VStack>
            </HStack>
          ))}
        </div>
      </Card>
    </div>
  );
}
