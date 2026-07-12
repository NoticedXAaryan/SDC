import { z } from "zod";

export const createBudgetSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  allocated: z.number().min(0, "Allocated budget must be a positive number"),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const createExpenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  receiptUrl: z.string().url("Must be a valid URL").optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>;

export const createIncomeSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  source: z.string().min(1, "Source is required"),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
