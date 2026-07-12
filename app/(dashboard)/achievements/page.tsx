import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { researchPapers, competitions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function AchievementsPage() {
  await requireSession();

  const papers = await db.select().from(researchPapers).orderBy(desc(researchPapers.createdAt));
  const wins = await db.select().from(competitions).orderBy(desc(competitions.createdAt));

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hall of Fame</h1>
          <p className="text-muted-foreground">Research papers and competition wins by our members.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Submit Paper</Button>
          <Button>Report Win</Button>
        </div>
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
                  {p.url && <a href={p.url} className="text-blue-500 text-sm hover:underline" target="_blank">Read Paper</a>}
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
                  {w.url && <a href={w.url} className="text-blue-500 text-sm hover:underline" target="_blank">View Details</a>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
