import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { vendors, procurementRequests, user } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <div className="max-w-6xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Procurement & Vendors</h1>
        <p className="text-muted-foreground">Manage external vendors and internal procurement requests.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-bold">Procurement Requests</h2>
          {requests.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                No procurement requests found.
              </CardContent>
            </Card>
          ) : (
            requests.map(({ req, user, vendor }) => (
              <Card key={req.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{req.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">{(req.status || "draft").replace("_", " ")}</Badge>
                  </div>
                  <CardDescription>Requested by: {user?.name || "Unknown"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{req.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm bg-muted/30 p-3 rounded-lg">
                    {req.estimatedCost !== null && (
                      <div><span className="text-muted-foreground">Est. Cost:</span> ${req.estimatedCost}</div>
                    )}
                    {vendor && (
                      <div><span className="text-muted-foreground">Vendor:</span> {vendor.name}</div>
                    )}
                    {req.quotesUrl && (
                      <div><a href={req.quotesUrl} target="_blank" className="text-blue-500 hover:underline">View Quotes</a></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Approved Vendors</h2>
          {allVendors.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                No vendors registered.
              </CardContent>
            </Card>
          ) : (
            allVendors.map(v => (
              <Card key={v.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-md">{v.name}</CardTitle>
                  <CardDescription>{v.category || "General"}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  {v.contactName && <div><span className="text-muted-foreground">Contact:</span> {v.contactName}</div>}
                  {v.email && <div><span className="text-muted-foreground">Email:</span> {v.email}</div>}
                  {v.phone && <div><span className="text-muted-foreground">Phone:</span> {v.phone}</div>}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
