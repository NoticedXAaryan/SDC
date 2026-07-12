import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Global Leaderboard</h1>
        <p className="text-muted-foreground">Top contributors and active members based on SDC Points.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 50 Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topUsers.map((u, index) => (
              <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 text-center font-bold text-lg text-muted-foreground">
                    #{index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={u.image || ""} />
                    <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-muted-foreground">Level {u.level}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{u.points || 0}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
