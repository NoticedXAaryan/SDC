import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApprovalActions } from "./approval-actions";

export default async function ApprovalsPage() {
  const session = await requireSession();
  if (session.user.role !== "admin") {
    redirect("/events");
  }

  const drafts = await db.select().from(events)
    .where(eq(events.status, "draft"))
    .orderBy(desc(events.createdAt));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Event Approvals</h1>
        <p className="text-muted-foreground">
          Review and approve events submitted by Leads.
        </p>
      </div>

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
    </div>
  );
}
