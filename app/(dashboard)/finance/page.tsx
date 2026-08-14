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

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Budget, Expense } from "@/lib/types";
import { SubmitExpenseDialog } from "./submit-expense-dialog";
import { ExpenseActions } from "./expense-actions";
import { OrbitalMetric, OrbitalMetricGrid } from "@/components/design-system/cosmic/OrbitalMetric";
import { CosmicSurface } from "@/components/design-system/cosmic/CosmicSurface";
import { PageHeader } from "@/components/astryx/page-header";

// Income type matches actual DB schema
interface Income {
  id: string;
  eventId: string;
  amount: string;
  source: string;
  createdAt: string;
}

export default function FinancePage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "budgets" | "expenses" | "income">("overview");

  useEffect(() => {
    async function load() {
      try {
        const [bRes, eRes, iRes] = await Promise.all([
          fetch("/api/finance/budgets").then((r) => r.json()),
          fetch("/api/finance/expenses").then((r) => r.json()),
          fetch("/api/finance/incomes").then((r) => r.json()),
        ]);
        setBudgets(bRes.budgets || bRes || []);
        setExpenses(eRes.expenses || eRes || []);
        setIncomes(iRes.incomes || iRes || []);
      } catch {
        toast.error("Failed to load finance data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const refreshExpenses = async () => {
    try {
      const res = await fetch("/api/finance/expenses").then((r) => r.json());
      setExpenses(res.expenses || res || []);
    } catch {
      // silently skip re-fetch errors; stale data is acceptable
    }
  };

  const totalBudget = Array.isArray(budgets)
    ? budgets.reduce((s: number, b) => s + (Number(b.allocated) || 0), 0)
    : 0;
  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((s: number, e) => s + (Number(e.amount) || 0), 0)
    : 0;
  const totalIncome = Array.isArray(incomes)
    ? incomes.reduce((s: number, i) => s + (Number(i.amount) || 0), 0)
    : 0;
  const balance = totalBudget + totalIncome - totalExpenses;

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
        primaryAction={<SubmitExpenseDialog budgets={budgets} onSubmitted={refreshExpenses} />}
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
            value={`₹${totalExpenses.toLocaleString()}`}
            icon={<ArrowDownRight aria-hidden="true" size={14} />}
            accent="none"
            trend={totalExpenses > totalBudget ? "down" : "neutral"}
            trendLabel={totalExpenses > totalBudget ? "over budget" : "on track"}
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
            onClick={() => setTab(t.id)}
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
                        Event ID
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
                          {b.eventId.slice(0, 8)}…
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
                          <ExpenseActions expense={e} onUpdate={refreshExpenses} />
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
