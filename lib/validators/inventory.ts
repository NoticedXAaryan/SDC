import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(120),
  qtyTotal: z.number().int().min(1, "Quantity must be at least 1"),
});

export const updateInventoryItemSchema = createInventoryItemSchema;

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;

export const logInventoryActionSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  action: z.enum(["check_in", "check_out"]),
  qty: z.number().int().min(1, "Quantity must be at least 1"),
});

export type LogInventoryActionInput = z.infer<typeof logInventoryActionSchema>;
