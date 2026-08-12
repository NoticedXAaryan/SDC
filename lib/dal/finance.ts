import { db } from "@/lib/db";
import { budgets, expenses, events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { createExpenseSchema, createBudgetSchema } from "@/lib/validators/finance";

export async function allocateBudget(sessionAuth: AuthSession, eventId: string, rawAllocated: any) {
  const { allocated } = createBudgetSchema.parse({ eventId, allocated: Number(rawAllocated) });
  const role = sessionAuth.user.role as string;
  if (!["admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
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

export async function addExpense(sessionAuth: AuthSession, eventId: string, rawData: any) {
  const role = sessionAuth.user.role as string;
  if (!["lead", "co_lead", "admin", "owner"].includes(role)) {
    throw new AuthorizationError("Unauthorized");
  }

  const budget = await db.query.budgets.findFirst({
    where: eq(budgets.eventId, eventId),
  });

  if (!budget) {
    throw new ValidationError("No budget allocated for this event yet");
  }

  const data = createExpenseSchema.parse({ budgetId: budget.id, ...rawData, amount: Number(rawData.amount) });

  const isAdmin = ["admin", "owner"].includes(role);
  if (!isAdmin) {
    const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) throw new ValidationError("Event not found");

    const isCreator = event.createdBy === sessionAuth.user.id;
    const isDomainMatch = sessionAuth.user.domain && event.domain && sessionAuth.user.domain === event.domain;
    
    if (!isCreator && !isDomainMatch) {
      throw new AuthorizationError("You can only add expenses to events within your domain or events you created.");
    }
  }

  const expenseId = crypto.randomUUID();
  await db.insert(expenses).values({
    id: expenseId,
    budgetId: budget.id,
    amount: String(data.amount),
    category: data.category,
    receiptUrl: data.receiptUrl || null,
    status: "pending",
    createdBy: sessionAuth.user.id,
  });

  return { expenseId };
}