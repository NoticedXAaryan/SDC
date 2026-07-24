import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { expenses, budgets, events } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";
import { EmptyState } from "@/components/astryx/empty-state";
import { Card } from "@astryxdesign/core/Card";
import { VStack } from "@astryxdesign/core/VStack";
import { HStack } from "@astryxdesign/core/HStack";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { redirect } from "next/navigation";

export default async function ExpensesPage() {
  const session = await requireSession();
  
  if (!["owner", "admin", "finance_lead", "lead"].includes(session.user.role as string)) {
    redirect("/");
  }

  const allExpenses = await db.select({
    id: expenses.id,
    amount: expenses.amount,
    category: expenses.category,
    status: expenses.status,
    createdAt: expenses.createdAt,
    receiptUrl: expenses.receiptUrl,
    eventTitle: events.title
  })
  .from(expenses)
  .leftJoin(budgets, eq(expenses.budgetId, budgets.id))
  .leftJoin(events, eq(budgets.eventId, events.id))
  .orderBy(desc(expenses.createdAt));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader 
        title="Expenses" 
        description="Track and manage club expenses."
      />

      {allExpenses.length === 0 ? (
        <EmptyState
          title="No expenses"
          description="There are currently no expenses recorded."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allExpenses.map(expense => (
            <Card key={expense.id}>
              <VStack gap={4}>
                <HStack justify="between" align="start">
                  <VStack gap={1}>
                    <Text weight="semibold" className="text-lg">{expense.eventTitle || "General Expense"}</Text>
                    <Text type="supporting" className="text-sm">{expense.category}</Text>
                  </VStack>
                  <Badge 
                    variant={expense.status === "approved" ? "success" : expense.status === "rejected" ? "error" : "warning"}
                    label={expense.status || "pending"}
                  />
                </HStack>
                
                <HStack justify="between" align="end">
                  <VStack gap={0}>
                    <Text weight="bold" className="text-2xl">₹{parseFloat(expense.amount as string).toFixed(2)}</Text>
                    <Text type="supporting" className="text-xs">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </Text>
                  </VStack>
                  
                  {expense.receiptUrl && (
                    <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm font-medium">
                      View Receipt
                    </a>
                  )}
                </HStack>
              </VStack>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
