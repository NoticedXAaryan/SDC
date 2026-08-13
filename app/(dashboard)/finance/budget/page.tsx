import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { budgets, expenses, incomes, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { HStack } from "@astryxdesign/core/HStack";
import { VStack } from "@astryxdesign/core/VStack";
import { PageHeader } from "@/components/astryx/page-header";
import { MetricCard } from "@/components/astryx/metric-card";
import { EmptyState } from "@/components/astryx/empty-state";

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

  const totalAllocated = allBudgets.reduce((acc, b) => acc + parseFloat(b.allocated as string || "0"), 0);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader 
        title="Finance & Budgeting" 
        description="Manage event budgets, track expenses, and oversee club finances."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Total Allocated Budget"
          value={`₹${totalAllocated.toFixed(2)}`}
          trend="up"
          trendValue="100% vs last year"
        />
      </div>

      <VStack gap={4}>
        <Text weight="bold" className="text-xl">Event Budgets</Text>
        
        {allBudgets.length === 0 ? (
          <EmptyState
            title="No budgets allocated"
            description="There are currently no budgets allocated for any events."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allBudgets.map(budget => (
              <Card key={budget.id}>
                <VStack gap={4}>
                  <VStack gap={1}>
                    <Text weight="semibold" className="text-lg">{budget.eventTitle}</Text>
                    <Text type="supporting">Allocated: ₹{parseFloat(budget.allocated as string || "0").toFixed(2)}</Text>
                  </VStack>
                  <Text type="supporting" className="text-sm">Detailed view pending implementation.</Text>
                </VStack>
              </Card>
            ))}
          </div>
        )}
      </VStack>
    </div>
  );
}
