"use client";

import { useEffect, useState } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Budget, Expense } from "@/lib/types";
import { SubmitExpenseDialog } from "./submit-expense-dialog";
import { ExpenseActions } from "./expense-actions";

// Income type matches actual DB schema: { id, eventId, amount, source, createdAt }
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
      } catch (err) {
        toast.error("Failed to load finance data");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const refreshExpenses = async () => {
    try {
      const res = await fetch("/api/finance/expenses").then(r => r.json());
      setExpenses(res.expenses || res || []);
    } catch (err) {}
  };

  const totalBudget = Array.isArray(budgets) ? budgets.reduce((s: number, b) => s + (Number(b.allocated) || 0), 0) : 0;
  const totalExpenses = Array.isArray(expenses) ? expenses.reduce((s: number, e) => s + (Number(e.amount) || 0), 0) : 0;
  const totalIncome = Array.isArray(incomes) ? incomes.reduce((s: number, i) => s + (Number(i.amount) || 0), 0) : 0;

  const summaryCards = [
    { label: "Total Budget", value: totalBudget, icon: Wallet, color: "text-primary" },
    { label: "Total Spent", value: totalExpenses, icon: ArrowDownRight, color: "text-amber-500" },
    { label: "Total Income", value: totalIncome, icon: ArrowUpRight, color: "text-emerald-500" },
    { label: "Balance", value: totalBudget + totalIncome - totalExpenses, icon: DollarSign, color: "text-foreground" },
  ];

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "budgets" as const, label: "Budgets" },
    { id: "expenses" as const, label: "Expenses" },
    { id: "income" as const, label: "Income" },
  ];

  return (
    <div className="space-y-6 pt-8 md:pt-0">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Finance</h1>
          <p className="text-sm text-muted-foreground">Track budgets, expenses, and income across all events.</p>
        </div>
        <SubmitExpenseDialog budgets={budgets} onSubmitted={refreshExpenses} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <card.icon className={cn("h-4 w-4", card.color)} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-2 text-xl font-semibold text-foreground">₹{card.value.toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-medium text-foreground">Recent Expenses</h3>
            {Array.isArray(expenses) && expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.slice(0, 5).map((e, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{e.category || "Expense"}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.createdAt ? new Date(e.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">₹{Number(e.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 text-sm font-medium text-foreground">Recent Income</h3>
            {Array.isArray(incomes) && incomes.length > 0 ? (
              <div className="space-y-3">
                {incomes.slice(0, 5).map((inc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{inc.source || "Income"}</p>
                      <p className="text-xs text-muted-foreground">
                        {inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-emerald-500">+₹{Number(inc.amount || 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No income recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === "budgets" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {Array.isArray(budgets) && budgets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event ID</th>
                    <th className="px-4 py-3 font-medium">Allocated</th>
                    <th className="px-4 py-3 font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {budgets.map((b, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{b.eventId.slice(0, 8)}…</td>
                      <td className="px-4 py-3">₹{Number(b.allocated || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No budgets allocated yet.</p>
          )}
        </div>
      )}

      {tab === "expenses" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {Array.isArray(expenses) && expenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {expenses.map((e, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{e.category}</td>
                      <td className="px-4 py-3">₹{Number(e.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">{e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "N/A"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-full text-xs", 
                          e.status === "approved" ? "bg-emerald-500/10 text-emerald-500" : 
                          e.status === "rejected" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {e.status || "pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ExpenseActions expense={e} onUpdate={refreshExpenses} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
          )}
        </div>
      )}

      {tab === "income" && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {Array.isArray(incomes) && incomes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Source</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {incomes.map((inc, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{inc.source}</td>
                      <td className="px-4 py-3 text-emerald-500">+₹{Number(inc.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">{inc.createdAt ? new Date(inc.createdAt).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No income entries recorded yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
