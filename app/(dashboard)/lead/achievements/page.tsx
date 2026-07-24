import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { achievementSubmissions, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card } from "@astryxdesign/core/Card";
import { Avatar } from "@astryxdesign/core/Avatar";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { Text } from "@astryxdesign/core/Text";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { ReviewActions } from "@/components/achievements/review-actions";

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
    <div className="max-w-5xl mx-auto space-y-8">
      <PageHeader 
        title="Review Achievements" 
        description="Approve or reject member achievement submissions to award points." 
      />

      {pending.length === 0 ? (
        <EmptyState
          title="All caught up"
          description="No pending achievements to review."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pending.map(({ submission, user }) => (
            <Card key={submission.id}>
              <VStack gap={4}>
                <HStack gap={3} align="center">
                  <Avatar 
                    name={user.name || "User"} 
                    src={user.image || undefined} 
                    size="sm" 
                  />
                  <Text weight="medium">{user.name}</Text>
                </HStack>
                
                <VStack gap={1}>
                  <Text weight="semibold" className="text-lg">{submission.title}</Text>
                  <Text type="supporting" className="text-xs">
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </Text>
                </VStack>
                
                <Text type="supporting" className="text-sm">
                  {submission.description}
                </Text>
                
                {submission.proofUrl && (
                  <a 
                    href={submission.proofUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline text-sm font-medium"
                  >
                    View Attached Proof
                  </a>
                )}
                
                <div className="pt-4 border-t border-border">
                  <ReviewActions submissionId={submission.id} />
                </div>
              </VStack>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
