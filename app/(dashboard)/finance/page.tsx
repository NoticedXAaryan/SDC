"use client";

/**
 * Finance Page — SOC design system compliant.
 * Journey: §02 "Track club finances" — budget overview, expense management, income.
 * States: loading (inline skeleton via BlackHoleLoader/Skeleton), empty (inline copy),
 *         error (toast), forbidden (role-gate on SubmitExpenseDialog).
 *
 * Astryx-first: no direct Astryx primitives available for data-tables.
 * SOC layer: OrbitalMetric, OrbitalMetricGrid, CosmicSurface, SOC token classes.
 * Shadcn exception: Skeleton from @/components/ui/skeleton (documented in §03 audit).
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Budget, Expense } from "@/lib/types";
import { SubmitExpenseDialog } from "./submit-expense-dialog";
import { ExpenseActions } from "./expense-actions";
import { AllocateBudgetDialog, RecordIncomeDialog } from "./finance-actions";
import { OrbitalMetric, OrbitalMetricGrid } from "@/components/design-system/cosmic/OrbitalMetric";
import { CosmicSurface } from "@/components/design-system/cosmic/CosmicSurface";
import { PageHeader } from "@/components/astryx/page-header";
import { useSession } from "@/lib/auth-client";

// Income type matches actual DB schema
interface Income {
  id: string;
  eventId: string;
  amount: string;
  source: string;
  createdAt: string;
}

interface EventOption {
  id: string;
  title: string;
}

export default function FinancePage() {
  const [budgets, setBudgets] = useState<Array<Budget & { eventTitle?: string | null }>>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [eventOptions, setEventOptions] = useState<EventOption[]>([]);
  const [availableBudgetEvents, setAvailableBudgetEvents] = useState<EventOption[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab = (["overview", "budgets", "expenses", "income"] as const).includes(requestedTab as "overview")
    ? requestedTab as "overview" | "budgets" | "expenses" | "income"
    : "overview";
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canSubmitExpenses = ["lead", "vice_lead", "co_lead", "event_lead", "finance_lead", "admin", "owner"].includes(role || "");
  const canApproveExpenses = ["finance_lead", "admin", "owner"].includes(role || "");
  const canManageFinance = ["finance_lead", "admin", "owner"].includes(role || "");

  const loadFinance = useCallback(async () => {
    try {
      const fetchFinanceData = async (url: string) => {
        const response = await fetch(url);
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Finance data could not be loaded");
        return data;
      };
      const [budgetResult, expenseResult, incomeResult] = await Promise.all([
        fetchFinanceData("/api/finance/budgets"),
        fetchFinanceData("/api/finance/expenses"),
        fetchFinanceData("/api/finance/incomes"),
      ]);
      setBudgets(budgetResult.budgets || []);
      setEventOptions(budgetResult.events || []);
      setAvailableBudgetEvents(budgetResult.availableBudgetEvents || []);
      setExpenses(expenseResult.expenses || expenseResult || []);
      setIncomes(incomeResult.incomes || incomeResult || []);
    } catch {
      toast.error("Finance data could not be loaded. Check your access and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const refreshExpenses = async () => {
    try {
      const response = await fetch("/api/finance/expenses");
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Expenses could not be refreshed");
      setExpenses(data.expenses || data || []);
    } catch {
      toast.error("Expenses could not be refreshed");
    }
  };

  const totalBudget = Array.isArray(budgets)
    ? budgets.reduce((s: number, b) => s + (Number(b.allocated) || 0), 0)
    : 0;
  const approvedExpenses = Array.isArray(expenses)
    ? expenses.filter((expense) => expense.status === "approved").reduce((sum: number, expense) => sum + (Number(expense.amount) || 0), 0)
    : 0;
  const pendingExpenses = Array.isArray(expenses)
    ? expenses.filter((expense) => expense.status === "pending").reduce((sum: number, expense) => sum + (Number(expense.amount) || 0), 0)
    : 0;
  const totalIncome = Array.isArray(incomes)
    ? incomes.reduce((s: number, i) => s + (Number(i.amount) || 0), 0)
    : 0;
  const balance = totalBudget + totalIncome - approvedExpenses;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "budgets" as const, label: "Budgets" },
    { id: "expenses" as const, label: "Expenses" },
    { id: "income" as const, label: "Income" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 animate-enter">
      <PageHeader
        title="Finance"
        description="Track budgets, expenses, and income across all events."
        primaryAction={(canManageFinance || canSubmitExpenses) ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {canManageFinance ? <AllocateBudgetDialog events={availableBudgetEvents} onChanged={loadFinance} /> : null}
            {canManageFinance ? <RecordIncomeDialog events={eventOptions} onChanged={loadFinance} /> : null}
            {canSubmitExpenses ? <SubmitExpenseDialog budgets={budgets} onSubmitted={loadFinance} /> : null}
          </div>
        ) : undefined}
      />

      {/* SOC metric cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="orbital-metric">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <OrbitalMetricGrid cols={4}>
          <OrbitalMetric
            title="Total Budget"
            value={`₹${totalBudget.toLocaleString()}`}
            icon={<Wallet aria-hidden="true" size={14} />}
            accent="violet"
          />
          <OrbitalMetric
            title="Total Spent"
            value={`₹${approvedExpenses.toLocaleString()}`}
            icon={<ArrowDownRight aria-hidden="true" size={14} />}
            accent="none"
            trend={approvedExpenses > totalBudget ? "down" : "neutral"}
            trendLabel={pendingExpenses > 0 ? `₹${pendingExpenses.toLocaleString()} pending` : "on track"}
          />
          <OrbitalMetric
            title="Total Income"
            value={`₹${totalIncome.toLocaleString()}`}
            icon={<ArrowUpRight aria-hidden="true" size={14} />}
            accent="lime"
            trend="up"
          />
          <OrbitalMetric
            title="Balance"
            value={`₹${balance.toLocaleString()}`}
            icon={<DollarSign aria-hidden="true" size={14} />}
            accent={balance < 0 ? "none" : "blue"}
            trend={balance < 0 ? "down" : "up"}
            trendLabel={balance < 0 ? "deficit" : "surplus"}
          />
        </OrbitalMetricGrid>
      )}

      {/* Tab navigation — accessible with role="tablist" */}
      <div
        role="tablist"
        aria-label="Finance sections"
        className="flex gap-1 overflow-x-auto border-b border-[var(--d-line)]"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.replace(`/finance?tab=${t.id}`, { scroll: false })}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-focus)]",
              tab === t.id
                ? "border-[var(--soc-accretion-violet)] text-[var(--soc-accretion-violet)]"
                : "border-transparent text-[var(--d-fg-dim)] hover:text-[var(--d-fg)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div role="tabpanel">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Recent Expenses */}
            <CosmicSurface variant="default" padding="md">
              <h3 className="mb-4 text-sm font-semibold text-[var(--d-fg)]">
                Recent Expenses
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : Array.isArray(expenses) && expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.slice(0, 5).map((e, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--d-fg)] truncate">
                          {e.category || "Expense"}
                        </p>
                        <p className="text-xs text-[var(--d-fg-dim)]">
                          {e.createdAt
                            ? new Date(e.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--d-fg)] shrink-0">
                        ₹{Number(e.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[var(--d-fg-dim)]">
                  No expenses recorded yet.
                </p>
              )}
            </CosmicSurface>

            {/* Recent Income */}
            <CosmicSurface variant="default" padding="md">
              <h3 className="mb-4 text-sm font-semibold text-[var(--d-fg)]">
                Recent Income
              </h3>
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : Array.isArray(incomes) && incomes.length > 0 ? (
                <div className="space-y-3">
                  {incomes.slice(0, 5).map((inc, i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-[var(--d-fg)] truncate">
                          {inc.source || "Income"}
                        </p>
                        <p className="text-xs text-[var(--d-fg-dim)]">
                          {inc.createdAt
                            ? new Date(inc.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-positive)] shrink-0">
                        +₹{Number(inc.amount || 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-[var(--d-fg-dim)]">
                  No income recorded yet.
                </p>
              )}
            </CosmicSurface>
          </div>
        )}

        {tab === "budgets" && (
          <CosmicSurface variant="default" padding="none">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : Array.isArray(budgets) && budgets.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" role="table">
                  <thead>
                    <tr className="border-b border-[var(--d-line)] bg-[var(--d-panel-alt)]">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--d-fg-dim)]">
                        Event
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--d-fg-dim)]">
                        Allocated
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--d-fg-dim)]">
                        Last Updated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--d-line)]">
                    {budgets.map((b, i) => (
                      <tr
                        key={i}
                        className="hover:bg-[var(--d-panel-alt)] transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-[var(--d-fg-dim)]">
                          {b.eventTitle || `${b.eventId.slice(0, 8)}…`}
                        </td>
                        <td className="px-5 py-3 font-semibold text-[var(--d-fg)]">
                          ₹{Number(b.allocated || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-[var(--d-fg-dim)]">
                          {b.updatedAt
                            ? new Date(b.updatedAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--d-fg-dim)]">
                No budgets allocated yet.
              </p>
            )}
          </CosmicSurface>
        )}

        {tab === "expenses" && (
          <CosmicSurface variant="default" padding="none">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : Array.isArray(expenses) && expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" role="table">
                  <thead>
                    <tr className="border-b border-[var(--d-line)] bg-[var(--d-panel-alt)]">
                      {["Category", "Amount", "Date", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--d-fg-dim)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--d-line)]">
                    {expenses.map((e, i) => (
                      <tr
                        key={i}
                        className="hover:bg-[var(--d-panel-alt)] transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-[var(--d-fg)]">
                          {e.category}
                        </td>
                        <td className="px-5 py-3 text-[var(--d-fg)]">
                          ₹{Number(e.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-[var(--d-fg-dim)]">
                          {e.createdAt
                            ? new Date(e.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                              e.status === "approved"
                                ? "bg-[rgba(34,197,94,0.12)] text-[var(--color-positive)]"
                                : e.status === "rejected"
                                ? "bg-[rgba(239,68,68,0.12)] text-[var(--color-danger)]"
                                : "bg-[rgba(245,158,11,0.12)] text-[var(--color-warning)]"
                            )}
                          >
                            {e.status || "pending"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <ExpenseActions expense={e} onUpdate={refreshExpenses} canApprove={canApproveExpenses} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--d-fg-dim)]">
                No expenses recorded yet.
              </p>
            )}
          </CosmicSurface>
        )}

        {tab === "income" && (
          <CosmicSurface variant="default" padding="none">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : Array.isArray(incomes) && incomes.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left" role="table">
                  <thead>
                    <tr className="border-b border-[var(--d-line)] bg-[var(--d-panel-alt)]">
                      {["Source", "Amount", "Date"].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-xs font-semibold uppercase tracking-widest text-[var(--d-fg-dim)]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--d-line)]">
                    {incomes.map((inc, i) => (
                      <tr
                        key={i}
                        className="hover:bg-[var(--d-panel-alt)] transition-colors"
                      >
                        <td className="px-5 py-3 font-medium text-[var(--d-fg)]">
                          {inc.source}
                        </td>
                        <td className="px-5 py-3 font-semibold text-[var(--color-positive)]">
                          +₹{Number(inc.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-[var(--d-fg-dim)]">
                          {inc.createdAt
                            ? new Date(inc.createdAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--d-fg-dim)]">
                No income entries recorded yet.
              </p>
            )}
          </CosmicSurface>
        )}
      </div>
    </div>
  );
}
