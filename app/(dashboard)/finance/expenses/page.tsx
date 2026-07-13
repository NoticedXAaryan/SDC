import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses, budgets, user, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddExpenseDialog } from "./components/add-expense-dialog";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  await requireRole(["admin", "owner", "finance_lead", "lead", "co_lead"]);
  
  const allExpenses = await db.select({
    id: expenses.id,
    amount: expenses.amount,
    category: expenses.category,
    status: expenses.status,
    createdAt: expenses.createdAt,
    eventName: events.title,
    createdBy: user.name,
  })
  .from(expenses)
  .leftJoin(budgets, eq(expenses.budgetId, budgets.id))
  .leftJoin(events, eq(budgets.eventId, events.id))
  .leftJoin(user, eq(expenses.createdBy, user.id))
  .orderBy(desc(expenses.createdAt));

  const allBudgets = await db.select({
    id: budgets.id,
    eventTitle: events.title
  }).from(budgets).leftJoin(events, eq(budgets.eventId, events.id));

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">Manage and track club expenses</p>
        </div>
        <AddExpenseDialog budgets={allBudgets as any[]} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {allExpenses.map(expense => (
          <Card key={expense.id}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">₹{expense.amount}</CardTitle>
                  <CardDescription className="mt-1">
                    {expense.category} • {expense.eventName || "General"}
                  </CardDescription>
                </div>
                <Badge variant={expense.status === "approved" ? "default" : expense.status === "rejected" ? "destructive" : "secondary"} className="capitalize">
                  {expense.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-0 pb-4 text-sm text-muted-foreground">
              Submitted by {expense.createdBy || "Unknown"} on {new Date(expense.createdAt).toLocaleDateString()}
            </CardContent>
          </Card>
        ))}
        {allExpenses.length === 0 && (
          <div className="p-8 text-center border rounded-lg text-muted-foreground border-dashed">
            No expenses found.
          </div>
        )}
      </div>
    </div>
  );
}
