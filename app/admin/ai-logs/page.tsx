import { requireAdmin } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { aiLogs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AILogsPage() {
  await requireAdmin();

  const logs = await db.select().from(aiLogs).orderBy(desc(aiLogs.createdAt)).limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">AI Logs</h2>
        <p className="text-muted-foreground">Monitor AI requests and responses across the system.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest 100 AI completion calls</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Latency</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="w-[300px]">Prompt Extract</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {log.entityType ? <Badge variant="outline">{log.entityType}</Badge> : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.latencyMs ? `${log.latencyMs}ms` : "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{log.modelUsed}</TableCell>
                  <TableCell className="text-xs truncate max-w-[300px]" title={log.prompt}>
                    {log.prompt.substring(0, 100)}...
                  </TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No AI logs recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
