import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, procurementRequests, user } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalActions } from "./approval-actions";
import { ProcurementActions } from "./procurement-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default async function ApprovalsPage() {
  const session = await requireSession();
  if (session.user.role !== "admin" && session.user.role !== "owner") {
    redirect("/events");
  }

  const drafts = await db.select().from(events)
    .where(eq(events.status, "draft"))
    .orderBy(desc(events.createdAt));

  const pendingProcurements = await db.select({
    id: procurementRequests.id,
    title: procurementRequests.title,
    description: procurementRequests.description,
    estimatedCost: procurementRequests.estimatedCost,
    createdAt: procurementRequests.createdAt,
    requestedBy: user.name,
  }).from(procurementRequests)
    .leftJoin(user, eq(procurementRequests.requestedBy, user.id))
    .where(eq(procurementRequests.status, "approval" as any))
    .orderBy(desc(procurementRequests.createdAt));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unified Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve events, procurement requests, and role changes.
        </p>
      </div>

      <Tabs defaultValue="events">
        <TabsList className="mb-4">
          <TabsTrigger value="events">
            Events {drafts.length > 0 && <Badge variant="secondary" className="ml-2">{drafts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="procurement">
            Procurement {pendingProcurements.length > 0 && <Badge variant="secondary" className="ml-2">{pendingProcurements.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="roles">
            Role Changes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-6">

      {drafts.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No pending events to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {drafts.map((draft) => (
            <Card key={draft.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{draft.title}</CardTitle>
                    <CardDescription>{new Date(draft.startsAt).toLocaleString()} • {draft.type}</CardDescription>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-200">
                    Pending Review
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{draft.description || "No description provided."}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                  <div>
                    <span className="block text-muted-foreground text-xs">Capacity</span>
                    <span className="font-medium">{draft.capacity || "Unlimited"}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-xs">Location</span>
                    <span className="font-medium">{draft.location || "TBA"}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-xs">Price</span>
                    <span className="font-medium">{draft.isPaid ? `₹${draft.price}` : "Free"}</span>
                  </div>
                  <div>
                    <span className="block text-muted-foreground text-xs">Custom Fields</span>
                    <span className="font-medium">{(draft.forms as any[])?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t pt-4">
                <ApprovalActions eventId={draft.id} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      </TabsContent>

      <TabsContent value="procurement" className="space-y-6">
        {pendingProcurements.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">No pending procurement requests.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {pendingProcurements.map((req) => (
              <Card key={req.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{req.title}</CardTitle>
                      <CardDescription>Requested by {req.requestedBy || "Unknown"} • {new Date(req.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-200">
                      Pending Approval
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{req.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                    <div>
                      <span className="block text-muted-foreground text-xs">Estimated Cost</span>
                      <span className="font-medium">₹{req.estimatedCost || 0}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end space-x-3 border-t pt-4">
                   <ProcurementActions reqId={req.id} />
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="roles" className="space-y-6">
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No pending role change requests.</p>
        </div>
      </TabsContent>
      </Tabs>
    </div>
  );
}
