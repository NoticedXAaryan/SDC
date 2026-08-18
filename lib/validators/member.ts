import { z } from "zod";
import { SDC_ROLES } from "@/lib/dal/auth";

export const memberSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(SDC_ROLES).optional(),
  year: z.coerce.number().int().min(1).max(6).optional(),
  sortBy: z.enum(["name", "createdAt", "points", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type MemberSearchParams = z.infer<typeof memberSearchSchema>;

export const roleChangeSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(SDC_ROLES, {
    message: `Role must be one of: ${SDC_ROLES.join(", ")}`,
  }),
});

export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

const memberUpdateActionSchema = z.object({
  action: z.literal("update"),
  name: z.string().trim().min(1).max(100).optional(),
  username: z.string()
    .trim()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username must use letters, numbers, underscores, or hyphens")
    .nullable()
    .optional(),
  year: z.number().int().min(1).max(6).nullable().optional(),
  branch: z.string().trim().max(100).nullable().optional(),
}).refine(
  ({ action: _action, ...fields }) => Object.values(fields).some((value) => value !== undefined),
  { message: "At least one profile field is required" },
);

export const memberLifecycleSchema = z.discriminatedUnion("action", [
  memberUpdateActionSchema,
  z.object({
    action: z.literal("ban"),
    reason: z.string().trim().min(3).max(500),
    durationSeconds: z.number().int().min(60).max(31_536_000).nullable(),
  }),
  z.object({ action: z.literal("unban") }),
  z.object({ action: z.literal("revoke_sessions") }),
]);

export type MemberLifecycleInput = z.infer<typeof memberLifecycleSchema>;

export const memberDeleteSchema = z.object({
  confirmUserId: z.string().min(1),
});

export type MemberDeleteInput = z.infer<typeof memberDeleteSchema>;
