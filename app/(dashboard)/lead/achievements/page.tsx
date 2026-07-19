import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { achievementSubmissions, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReviewActions } from "@/components/achievements/review-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function LeadAchievementsPage() {
  await requireRole(["event_lead", "lead", "admin", "owner"]);

  const pending = await db.select({
    submission: achievementSubmissions,
    user: {
      id: user.id,
      name: user.name,
      image: user.image
    }
  })
  .from(achievementSubmissions)
  .innerJoin(user, eq(achievementSubmissions.userId, user.id))
  .where(eq(achievementSubmissions.status, "pending"))
  .orderBy(desc(achievementSubmissions.createdAt));

  return (
    <div className="max-w-5xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Review Achievements</h1>
        <p className="text-muted-foreground">Approve or reject member achievement submissions to award points.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pending.length === 0 ? (
          <Card className="col-span-full border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              No pending achievements to review.
            </CardContent>
          </Card>
        ) : (
          pending.map(({ submission, user }) => (
            <Card key={submission.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} />
                    <AvatarFallback>{user.name?.substring(0, 2).toUpperCase() || "US"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{user.name}</span>
                </div>
                <CardTitle className="text-lg">{submission.title}</CardTitle>
                <CardDescription className="text-xs">{new Date(submission.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{submission.description}</p>
                {submission.proofUrl && (
                  <a href={submission.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm font-medium block">
                    View Attached Proof
                  </a>
                )}
                <div className="pt-4 border-t">
                  <ReviewActions submissionId={submission.id} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
