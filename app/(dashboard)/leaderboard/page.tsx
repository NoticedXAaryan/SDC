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
import { Trophy, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function LeaderboardPage() {
  const session = await requireSession();
  const currentUserId = session.user.id;

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

  const getRankStyling = (index: number) => {
    switch (index) {
      case 0: return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 border-l-4 border-l-yellow-500 hover:bg-yellow-500/20";
      case 1: return "bg-gradient-to-r from-gray-400/10 to-gray-500/5 border-l-4 border-l-gray-400 hover:bg-gray-400/20";
      case 2: return "bg-gradient-to-r from-amber-700/10 to-amber-800/5 border-l-4 border-l-amber-700 hover:bg-amber-700/20";
      default: return "border-l-4 border-l-transparent hover:bg-muted/50";
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-md" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400 drop-shadow-md" />;
      case 2: return <Medal className="w-6 h-6 text-amber-700 drop-shadow-md" />;
      default: return null;
    }
  };

  const podiumUsers = topUsers.slice(0, 3);
  const listUsers = topUsers.slice(3);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="Global Leaderboard" 
        description="Top contributors and active members based on SDC Points." 
      />

      {podiumUsers.length >= 3 && (
        <div className="flex justify-center items-end h-64 gap-2 sm:gap-6 mb-12 mt-8">
          {/* 2nd Place */}
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
            <Avatar name={podiumUsers[1].name || "User"} src={podiumUsers[1].image || undefined} size="lg" className="mb-3 ring-4 ring-gray-400 ring-offset-4 ring-offset-background" />
            <Text weight="semibold" className="text-center truncate w-full text-sm">{podiumUsers[1].name}</Text>
            <Text type="supporting" className="text-xs">{podiumUsers[1].points} pts</Text>
            <div className="w-full h-24 bg-gradient-to-t from-gray-500/20 to-gray-400/40 rounded-t-lg border-t-4 border-gray-400 mt-4 flex items-center justify-center">
              <Text weight="bold" className="text-2xl text-gray-500/50">2</Text>
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center flex-1 max-w-[140px] z-10">
            <Trophy className="w-8 h-8 text-yellow-500 mb-2 drop-shadow-md" />
            <Avatar name={podiumUsers[0].name || "User"} src={podiumUsers[0].image || undefined} size="xl" className="mb-3 ring-4 ring-yellow-500 ring-offset-4 ring-offset-background" />
            <Text weight="bold" className="text-center truncate w-full">{podiumUsers[0].name}</Text>
            <Text type="supporting" className="text-sm font-medium">{podiumUsers[0].points} pts</Text>
            <div className="w-full h-32 bg-gradient-to-t from-yellow-600/20 to-yellow-500/40 rounded-t-lg border-t-4 border-yellow-500 mt-4 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Text weight="bold" className="text-4xl text-yellow-600/50">1</Text>
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center flex-1 max-w-[120px]">
            <Avatar name={podiumUsers[2].name || "User"} src={podiumUsers[2].image || undefined} size="lg" className="mb-3 ring-4 ring-amber-700 ring-offset-4 ring-offset-background" />
            <Text weight="semibold" className="text-center truncate w-full text-sm">{podiumUsers[2].name}</Text>
            <Text type="supporting" className="text-xs">{podiumUsers[2].points} pts</Text>
            <div className="w-full h-20 bg-gradient-to-t from-amber-800/20 to-amber-700/40 rounded-t-lg border-t-4 border-amber-700 mt-4 flex items-center justify-center">
              <Text weight="bold" className="text-2xl text-amber-800/50">3</Text>
            </div>
          </div>
        </div>
      )}

      <Card padding={0} className="overflow-hidden border-border/50 shadow-xl shadow-blue-900/5">
        <div className="bg-muted/30 border-b border-border p-4">
          <Text weight="semibold" className="uppercase tracking-wider text-xs">Top Members</Text>
        </div>
        <div className="divide-y divide-border">
          {listUsers.map((u, i) => {
            const index = i + 3; // Offset by 3 for podium
            const isCurrentUser = u.id === currentUserId;
            return (
            <div key={u.id} className={cn("p-4 transition-all duration-300", getRankStyling(index), isCurrentUser && "bg-primary/5 border-l-primary/50 hover:bg-primary/10")}>
              <HStack justify="between" align="center">
                <HStack gap={4} align="center">
                  <div className="w-10 text-center flex justify-center">
                    {index < 3 ? getRankIcon(index) : (
                      <Text type="supporting" weight="bold" className="text-lg">#{index + 1}</Text>
                    )}
                  </div>
                  <Avatar 
                    name={u.name || "User"} 
                    src={u.image || undefined} 
                    size="lg" 
                  />
                  <VStack gap={0}>
                    <Text weight="semibold" className={index < 3 ? "text-foreground" : ""}>{u.name}</Text>
                    <Text type="supporting" className="text-sm">Level {u.level}</Text>
                  </VStack>
                </HStack>
                <VStack gap={0} align="end">
                  <Text weight="bold" className={cn("text-xl", index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-foreground")}>
                    {u.points || 0}
                  </Text>
                  <Text type="supporting" className="text-[10px] uppercase tracking-widest opacity-80">Points</Text>
                </VStack>
              </HStack>
            </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
