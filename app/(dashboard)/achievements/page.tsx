import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { researchPapers, competitions, achievementSubmissions } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitAchievementDialog } from "@/components/achievements/submit-achievement-dialog";
import { Badge } from "@/components/ui/badge";

export default async function AchievementsPage() {
  const session = await requireSession();

  const papers = await db.select().from(researchPapers).orderBy(desc(researchPapers.createdAt));
  const wins = await db.select().from(competitions).orderBy(desc(competitions.createdAt));
  const submissions = await db.select().from(achievementSubmissions)
    .where(eq(achievementSubmissions.userId, session.user.id))
    .orderBy(desc(achievementSubmissions.createdAt));

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hall of Fame & Achievements</h1>
          <p className="text-muted-foreground">Submit your achievements to earn points and climb the leaderboard.</p>
        </div>
        <div className="flex gap-2">
          <SubmitAchievementDialog />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold">My Submissions</h2>
        {submissions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">You haven't submitted any achievements yet.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submissions.map(sub => (
              <Card key={sub.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{sub.title}</CardTitle>
                    <Badge variant={sub.status === "approved" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}>
                      {sub.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{new Date(sub.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm line-clamp-3 mb-2">{sub.description}</p>
                  <div className="flex justify-between items-center text-sm">
                    {sub.proofUrl ? (
                      <a href={sub.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Proof</a>
                    ) : (
                      <span className="text-muted-foreground">No proof attached</span>
                    )}
                    <span className="font-semibold text-green-600">+{sub.pointsAwarded || 0} pts</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Research Papers</h2>
          {papers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">No papers published yet.</CardContent>
            </Card>
          ) : (
            papers.map(p => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Authors: {p.authors}</p>
                  {p.url && <a href={p.url} className="text-blue-500 text-sm hover:underline" target="_blank" rel="noopener noreferrer">Read Paper</a>}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Competition Wins</h2>
          {wins.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">No competition wins yet.</CardContent>
            </Card>
          ) : (
            wins.map(w => (
              <Card key={w.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{w.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-green-600">Position: {w.position}</p>
                  {w.url && <a href={w.url} className="text-blue-500 text-sm hover:underline" target="_blank" rel="noopener noreferrer">View Details</a>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
