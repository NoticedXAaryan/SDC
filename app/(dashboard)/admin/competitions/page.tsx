import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { competitions, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { Card, VStack, HStack, Heading, Text, Button, Badge } from "@astryxdesign/core";
import { Trophy, Plus, ExternalLink } from "lucide-react";

export default async function AdminCompetitionsPage() {
  await requireRole(["admin", "owner"]);

  const items = await db.select({
    competition: competitions,
    user: { name: user.name }
  })
  .from(competitions)
  .leftJoin(user, eq(competitions.userId, user.id))
  .orderBy(desc(competitions.date));

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Competitions" 
        description="Manage internal and external competition participations and results."
        primaryAction={
          <Button variant="primary" label="Record Participation" icon={<Plus className="w-4 h-4" />} />
        }
      />

      <Card padding={6}>
        <VStack gap={4}>
          <HStack align="center" gap={2} className="border-b pb-4">
            <Trophy className="w-5 h-5 text-primary" />
            <Heading level={3} className="text-lg">Competition History</Heading>
          </HStack>

          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No competitions recorded yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(({ competition, user }) => (
                <Card key={competition.id} padding={4}>
                  <VStack gap={3}>
                    <HStack justify="between" align="start">
                      <Badge label={competition.position} variant={competition.position.toLowerCase().includes('1st') || competition.position.toLowerCase().includes('winner') ? "success" : "neutral"} />
                      <Text type="supporting" className="text-xs">
                        {competition.date ? new Date(competition.date).toLocaleDateString() : 'Unknown Date'}
                      </Text>
                    </HStack>
                    
                    <VStack gap={1}>
                      <Heading level={4} className="text-base">{competition.title}</Heading>
                      <Text type="supporting" className="text-sm">Participant: {user?.name || "Unknown"}</Text>
                    </VStack>

                    {competition.url && (
                      <div className="pt-2">
                        <Button 
                          href={competition.url}
                          target="_blank"
                          variant="ghost" 
                          size="sm" 
                          label="View Details" 
                          icon={<ExternalLink className="w-4 h-4" />} 
                        />
                      </div>
                    )}
                  </VStack>
                </Card>
              ))}
            </div>
          )}
        </VStack>
      </Card>
    </div>
  );
}
