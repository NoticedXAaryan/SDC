import { requireAdmin } from "@/lib/dal/auth";
import { emailQueue } from "@/lib/queues/email";
import { aiQueue } from "@/lib/queues/ai";
import { gradingQueue } from "@/lib/workers/grading";
import { certificateQueue } from "@/lib/queues/certificates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Failed Jobs (Dead Letter Queue)</h1>
      <div className="grid gap-6">
        {failedJobs.map((q) => (
          <Card key={q.queueName}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{q.queueName} Queue</span>
                <Badge variant="destructive">{q.jobs.length} Failed</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.jobs.length === 0 ? (
                <p className="text-muted-foreground">No failed jobs.</p>
              ) : (
                <ul className="space-y-4">
                  {q.jobs.map((job) => (
                    <li key={job.id} className="border-b pb-4 last:border-0 last:pb-0">
                      <div className="font-medium">{job.name} (ID: {job.id})</div>
                      <div className="text-sm text-red-500 mt-1">{job.failedReason}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(job.timestamp).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
