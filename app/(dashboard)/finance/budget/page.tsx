import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { budgets, expenses, incomes, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function FinanceDashboardPage() {
  const session = await requireSession();
  
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "finance_lead", "lead"].includes(userRole as string)) {
    redirect("/");
  }

  const allBudgets = await db.select({
    id: budgets.id,
    allocated: budgets.allocated,
    eventTitle: events.title
  }).from(budgets).leftJoin(events, eq(budgets.eventId, events.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finance & Budgeting</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Allocated Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ₹{allBudgets.reduce((acc, b) => acc + parseFloat(b.allocated as string || "0"), 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Event Budgets</h2>
        {allBudgets.map(budget => (
          <Card key={budget.id}>
            <CardHeader>
              <CardTitle>{budget.eventTitle}</CardTitle>
              <CardDescription>Allocated: ₹{budget.allocated}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Detailed view pending implementation.</p>
            </CardContent>
          </Card>
        ))}
        {allBudgets.length === 0 && (
          <div className="p-8 text-center border rounded-lg text-muted-foreground border-dashed">
            No budgets allocated.
          </div>
        )}
      </div>
    </div>
  );
}
