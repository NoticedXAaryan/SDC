import { z } from "zod";
import { STC_ROLES } from "@/lib/dal/auth";

export const memberSearchSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(STC_ROLES).optional(),
  year: z.coerce.number().int().optional(),
  sortBy: z.enum(["name", "createdAt", "points", "role"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type MemberSearchParams = z.infer<typeof memberSearchSchema>;

export const roleChangeSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(STC_ROLES, {
    message: `Role must be one of: ${STC_ROLES.join(", ")}`,
  }),
});

export type RoleChangeInput = z.infer<typeof roleChangeSchema>;

export const memberUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Username must be alphanumeric").optional(),
  year: z.number().int().min(1).max(6).optional(),
  branch: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
});

export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
