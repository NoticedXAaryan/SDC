import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { vendors, procurementRequests, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";

export default async function ProcurementPage() {
  await requireRole(["finance_lead", "lead", "admin", "owner", "faculty_coordinator"]);

  const allVendors = await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  const requests = await db.select({
    req: procurementRequests,
    user: { name: user.name },
    vendor: { name: vendors.name }
  })
  .from(procurementRequests)
  .leftJoin(user, eq(procurementRequests.requestedBy, user.id))
  .leftJoin(vendors, eq(procurementRequests.selectedVendorId, vendors.id))
  .orderBy(desc(procurementRequests.createdAt));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader 
        title="Procurement & Vendors" 
        description="Manage external vendors and internal procurement requests." 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <VStack gap={4} className="lg:col-span-2">
          <Text weight="bold" className="text-2xl">Procurement Requests</Text>
          {requests.length === 0 ? (
            <EmptyState
              title="No requests"
              description="No procurement requests found."
            />
          ) : (
            <VStack gap={4}>
              {requests.map(({ req, user, vendor }) => (
                <Card key={req.id}>
                  <VStack gap={4}>
                    <HStack justify="between" align="start">
                      <VStack gap={1}>
                        <Text weight="semibold" className="text-lg">{req.title}</Text>
                        <Text type="supporting" className="text-sm">Requested by: {user?.name || "Unknown"}</Text>
                      </VStack>
                      <Badge 
                        variant={req.status === "approved" || req.status === "completed" ? "success" : req.status === "rejected" ? "error" : "neutral"}
                        label={(req.status || "draft").replace("_", " ")} 
                        className="capitalize"
                      />
                    </HStack>
                    
                    <Text type="supporting" className="text-sm">{req.description}</Text>
                    
                    <HStack gap={4} wrap="wrap" className="text-sm bg-muted/30 p-3 rounded-lg border border-border">
                      {req.estimatedCost !== null && (
                        <Text><Text as="span" type="supporting">Est. Cost: </Text>₹{req.estimatedCost}</Text>
                      )}
                      {vendor && (
                        <Text><Text as="span" type="supporting">Vendor: </Text>{vendor.name}</Text>
                      )}
                      {req.quotesUrl && (
                        <a href={req.quotesUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          View Quotes
                        </a>
                      )}
                    </HStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>

        <VStack gap={4}>
          <Text weight="bold" className="text-2xl">Approved Vendors</Text>
          {allVendors.length === 0 ? (
            <EmptyState
              title="No vendors"
              description="No vendors registered."
            />
          ) : (
            <VStack gap={4}>
              {allVendors.map(v => (
                <Card key={v.id}>
                  <VStack gap={3}>
                    <VStack gap={0}>
                      <Text weight="semibold" className="text-md">{v.name}</Text>
                      <Text type="supporting" className="text-xs">{v.category || "General"}</Text>
                    </VStack>
                    
                    <VStack gap={1}>
                      {v.contactName && <Text type="supporting" className="text-sm"><Text as="span" weight="medium">Contact: </Text>{v.contactName}</Text>}
                      {v.email && <Text type="supporting" className="text-sm"><Text as="span" weight="medium">Email: </Text>{v.email}</Text>}
                      {v.phone && <Text type="supporting" className="text-sm"><Text as="span" weight="medium">Phone: </Text>{v.phone}</Text>}
                    </VStack>
                  </VStack>
                </Card>
              ))}
            </VStack>
          )}
        </VStack>
      </div>
    </div>
  );
}
