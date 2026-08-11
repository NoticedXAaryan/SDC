import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events, procurementRequests, user } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Card, Text, Badge, TabList, Tab, VStack, HStack } from "@astryxdesign/core";
import { PageHeader } from "@/components/astryx/page-header";
import { ApprovalActions } from "./approval-actions";
import { ProcurementActions } from "./procurement-actions";
import { ApprovalTabsNav } from "./approval-tabs-nav";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "events" } = await searchParams;
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
      <VStack gap={2}>
        <Text as="h1" className="text-3xl font-bold tracking-tight">Unified Approvals</Text>
        <Text type="supporting">
          Review and approve events, procurement requests, and role changes.
        </Text>
      </VStack>

      <ApprovalTabsNav currentTab={tab} eventsCount={drafts.length} procurementsCount={pendingProcurements.length} />

      {tab === "events" && (
        <VStack gap={6}>
      {drafts.length === 0 ? (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <Text type="supporting">No pending events to review.</Text>
        </div>
      ) : (
        <VStack gap={6}>
          {drafts.map((draft) => (
            <Card key={draft.id} padding={6}>
              <VStack gap={4}>
                <HStack justify="between" align="start">
                  <VStack gap={1}>
                    <Text weight="bold" className="text-lg">{draft.title}</Text>
                    <Text type="supporting" className="text-sm">{new Date(draft.startsAt).toLocaleString()} • {draft.type}</Text>
                  </VStack>
                  <Badge label="Pending Review" variant="warning" />
                </HStack>
                
                <Text className="text-sm">{draft.description || "No description provided."}</Text>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                  <VStack gap={1}>
                    <Text type="supporting" className="text-xs">Capacity</Text>
                    <Text weight="medium">{draft.capacity || "Unlimited"}</Text>
                  </VStack>
                  <VStack gap={1}>
                    <Text type="supporting" className="text-xs">Location</Text>
                    <Text weight="medium">{draft.location || "TBA"}</Text>
                  </VStack>
                  <VStack gap={1}>
                    <Text type="supporting" className="text-xs">Price</Text>
                    <Text weight="medium">{draft.isPaid ? `₹${draft.price}` : "Free"}</Text>
                  </VStack>
                  <VStack gap={1}>
                    <Text type="supporting" className="text-xs">Custom Fields</Text>
                    <Text weight="medium">{(draft.forms as any[])?.length || 0}</Text>
                  </VStack>
                </div>
                
                <div className="flex justify-end border-t pt-4">
                  <ApprovalActions eventId={draft.id} />
                </div>
              </VStack>
            </Card>
          ))}
        </VStack>
      )}
      </VStack>
      )}

      {tab === "procurement" && (
        <VStack gap={6}>
        {pendingProcurements.length === 0 ? (
          <div className="text-center p-12 border rounded-lg bg-muted/20">
            <Text type="supporting">No pending procurement requests.</Text>
          </div>
        ) : (
          <VStack gap={6}>
            {pendingProcurements.map((req) => (
              <Card key={req.id} padding={6}>
                <VStack gap={4}>
                  <HStack justify="between" align="start">
                    <VStack gap={1}>
                      <Text weight="bold" className="text-lg">{req.title}</Text>
                      <Text type="supporting" className="text-sm">Requested by {req.requestedBy || "Unknown"} • {new Date(req.createdAt).toLocaleDateString()}</Text>
                    </VStack>
                    <Badge label="Pending Approval" variant="warning" />
                  </HStack>
                  
                  <Text className="text-sm">{req.description}</Text>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
                    <VStack gap={1}>
                      <Text type="supporting" className="text-xs">Estimated Cost</Text>
                      <Text weight="medium">₹{req.estimatedCost || 0}</Text>
                    </VStack>
                  </div>
                  
                  <div className="flex justify-end space-x-3 border-t pt-4">
                     <ProcurementActions reqId={req.id} />
                  </div>
                </VStack>
              </Card>
            ))}
          </VStack>
        )}
        </VStack>
      )}

      {tab === "roles" && (
        <div className="text-center p-12 border rounded-lg bg-muted/20">
          <Text type="supporting">No pending role change requests.</Text>
        </div>
      )}
    </div>
  );
}
