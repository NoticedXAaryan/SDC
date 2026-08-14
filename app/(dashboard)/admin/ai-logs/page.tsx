import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { aiLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default async function AILogsPage() {
  await requireAdmin();

  const logs = await db.select()
    .from(aiLogs)
    .orderBy(desc(aiLogs.createdAt))
    .limit(100);

  return (
    <div className="max-w-7xl mx-auto py-12 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Usage Logs</h1>
        <p className="text-muted-foreground">Monitor automated evaluations, drafting, and generic AI operations.</p>
      </div>
      
      <div className="space-y-4">
        {logs.map(log => (
          <Card key={log.id} className="overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4 border-b">
              <div className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {(log.status || "UNKNOWN").toUpperCase()}
                  </Badge>
                  <span className="text-sm font-medium text-muted-foreground">
                    {log.entityType ? log.entityType.toUpperCase() : "GENERAL"}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>{log.latencyMs}ms</span>
                  <span>{formatDistanceToNow(log.createdAt, { addSuffix: true })}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x">
              <div className="flex-1 p-4 bg-muted/10 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prompt</h3>
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80 break-words line-clamp-6 hover:line-clamp-none">
                  {log.prompt}
                </pre>
              </div>
              <div className="flex-1 p-4 bg-muted/5 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Response</h3>
                <pre className="text-xs whitespace-pre-wrap font-mono text-foreground/80 break-words line-clamp-6 hover:line-clamp-none">
                  {log.response}
                </pre>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {logs.length === 0 && (
          <div className="text-center p-12 border border-dashed rounded-lg text-muted-foreground">
            No AI logs found.
          </div>
        )}
      </div>
    </div>
  );
}
