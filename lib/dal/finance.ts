import { db } from "@/lib/db";
import { budgets, expenses, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";

export async function allocateBudget(sessionAuth: AuthSession, eventId: string, allocated: string | number) {
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  if (allocated === undefined || isNaN(Number(allocated))) {
    throw new ValidationError("Valid allocated amount is required");
  }

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    throw new ValidationError("Event not found");
  }

  const existingBudget = await db.query.budgets.findFirst({
    where: eq(budgets.eventId, eventId),
  });

  if (existingBudget) {
    throw new ValidationError("Budget already allocated for this event. Use PUT/PATCH to update.");
  }

  const budgetId = crypto.randomUUID();
  await db.insert(budgets).values({
    id: budgetId,
    eventId,
    allocated: String(allocated),
  });

  return { budgetId };
}

export async function addExpense(sessionAuth: AuthSession, eventId: string, data: { amount: string | number; category: string; receiptUrl?: string }) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const { amount, category, receiptUrl } = data;

  if (!amount || isNaN(Number(amount)) || !category) {
    throw new ValidationError("Amount and category are required");
  }

  const budget = await db.query.budgets.findFirst({
    where: eq(budgets.eventId, eventId),
  });

  if (!budget) {
    throw new ValidationError("No budget allocated for this event yet");
  }

  const expenseId = crypto.randomUUID();
  await db.insert(expenses).values({
    id: expenseId,
    budgetId: budget.id,
    amount: String(amount),
    category,
    receiptUrl: receiptUrl || null,
    status: "pending",
    createdBy: sessionAuth.user.id,
  });

  return { expenseId };
}