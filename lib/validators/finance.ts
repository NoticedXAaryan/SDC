import { z } from "zod";

// ─── Budget ────────────────────────────────────────────────────────────────

export const createBudgetSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  allocated: z.number().min(0, "Allocated budget must be a positive number"),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export const updateBudgetSchema = z.object({
  allocated: z.number().min(0, "Allocated budget must be a positive number"),
  reason: z.string().max(500).optional(),
});

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// ─── Expense ──────────────────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  budgetId: z.string().min(1, "Budget ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  category: z.string().min(1, "Category is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  receiptUrl: z.string().url("Must be a valid URL").optional().nullable(),
  vendorId: z.string().optional().nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reason: z.string().max(500).optional().nullable(),
});

export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>;

// ─── Income ───────────────────────────────────────────────────────────────

export const createIncomeSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  source: z.string().min(1, "Source is required").max(200),
  description: z.string().max(500).optional().nullable(),
});

export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;

// ─── Inventory ────────────────────────────────────────────────────────────

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  qtyTotal: z.number().int().min(1, "Total quantity must be at least 1"),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const inventoryActionSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  qty: z.number().int().min(1, "Quantity must be a positive integer"),
  action: z.enum(["check_out", "check_in"]),
  eventId: z.string().optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  /** Caller-supplied idempotency key — safe to retry checkout/checkin */
  idempotencyKey: z.string().max(128).optional(),
});

export type InventoryActionInput = z.infer<typeof inventoryActionSchema>;

// ─── Procurement ──────────────────────────────────────────────────────────

export const createProcurementSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  eventId: z.string().optional().nullable(),
  estimatedCost: z.number().int().min(0).optional(),
  selectedVendorId: z.string().optional().nullable(),
  quotesUrl: z.string().url().optional().nullable(),
});

export type CreateProcurementInput = z.infer<typeof createProcurementSchema>;

export const procurementStatusSchema = z.object({
  status: z.enum(["draft", "pending_quotes", "approval", "approved", "rejected", "completed"]),
  reason: z.string().max(500).optional().nullable(),
});

export type ProcurementStatusInput = z.infer<typeof procurementStatusSchema>;
