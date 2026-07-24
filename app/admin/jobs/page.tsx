import { requireAdmin } from "@/lib/dal/auth";
import { emailQueue } from "@/lib/queues/email";
import { aiQueue } from "@/lib/queues/ai";
import { gradingQueue } from "@/lib/queues/grading";
import { certificateQueue } from "@/lib/queues/certificates";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { PageHeader } from "@/components/astryx/page-header";

export default async function AdminJobsPage() {
  await requireAdmin();

  const queues = [
    { name: "Email", queue: emailQueue },
    { name: "AI Processing", queue: aiQueue },
    { name: "Grading", queue: gradingQueue },
    { name: "Certificates", queue: certificateQueue },
  ];

  const failedJobs = await Promise.all(
    queues.map(async (q) => {
      const jobs = await q.queue.getFailed();
      return {
        queueName: q.name,
        jobs: jobs.map(j => ({
          id: j.id,
          name: j.name,
          failedReason: j.failedReason,
          timestamp: j.timestamp,
        }))
      };
    })
  );

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8">
      <PageHeader 
        title="Failed Jobs (Dead Letter Queue)" 
        description="Monitor and manage background task failures."
      />
      
      <div className="grid gap-6">
        {failedJobs.map((q) => (
          <Card key={q.queueName} padding={6}>
            <VStack gap={4}>
              <HStack justify="between" align="center" className="border-b border-border pb-4">
                <Text weight="bold" className="text-xl">{q.queueName} Queue</Text>
                <Badge variant="error" label={`${q.jobs.length} Failed`} />
              </HStack>
              
              <div>
                {q.jobs.length === 0 ? (
                  <Text type="supporting">No failed jobs.</Text>
                ) : (
                  <ul className="space-y-4">
                    {q.jobs.map((job) => (
                      <li key={job.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                        <VStack gap={1}>
                          <Text weight="medium">{job.name} (ID: {job.id})</Text>
                          <Text className="text-sm text-red-500">{job.failedReason}</Text>
                          <Text type="supporting" className="text-xs">
                            {new Date(job.timestamp).toLocaleString()}
                          </Text>
                        </VStack>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </VStack>
          </Card>
        ))}
      </div>
    </div>
  );
}
