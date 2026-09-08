import { z } from "zod";

const safeAssetUrlSchema = z.union([z.literal(""), z.string().trim().max(2048).refine((value) => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}, "Use an internal path or an HTTP(S) URL")]);

const internalRedirectSchema = z.union([z.literal(""), z.string().trim().max(2048).refine(
  (value) => value.startsWith("/") && !value.startsWith("//"),
  "Redirect must be an internal path beginning with /",
)]);

const visibilityRuleSchema = z.object({
  fieldId: z.string().min(1).max(200),
  operator: z.enum(["equals", "not_equals"]),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export const formFieldSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["short_text", "long_text", "email", "number", "dropdown", "checkbox", "file", "date", "rating", "section_break", "image"]),
  label: z.string().trim().min(1).max(300),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
  autoFillKey: z.string().trim().max(100).optional(),
  visibilityRules: z.object({
    showIf: z.array(visibilityRuleSchema).max(20),
  }).optional(),
});

export const formSettingsSchema = z.object({
  allowExternal: z.boolean().default(false),
  requireLogin: z.boolean().default(true),
  allowMultiple: z.boolean().default(false),
  autoFillProfile: z.boolean().default(true),
  quotaPerUser: z.number().int().min(1).max(1000).default(1),
  quotaPerForm: z.number().int().min(1).max(1_000_000).default(1000),
  collegeDomainOnly: z.boolean().default(true),
  theme: z.object({
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
    fontFamily: z.enum(["Inter", "Roboto", "Georgia"]).default("Inter"),
    backgroundImage: safeAssetUrlSchema.nullable().default(null),
  }).default({ accentColor: "#3b82f6", fontFamily: "Inter", backgroundImage: null }),
  thankYouMessage: z.string().trim().min(1).max(1000).default("Thank you for submitting!"),
  redirectUrl: internalRedirectSchema.nullable().default(null),
}).default({
  allowExternal: false,
  requireLogin: true,
  allowMultiple: false,
  autoFillProfile: true,
  quotaPerUser: 1,
  quotaPerForm: 1000,
  collegeDomainOnly: true,
  theme: { accentColor: "#3b82f6", fontFamily: "Inter", backgroundImage: null },
  thankYouMessage: "Thank you for submitting!",
  redirectUrl: null,
});

export const formDefinitionSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional().nullable(),
  status: z.enum(["draft", "published", "closed", "archived"]).default("draft"),
  settings: formSettingsSchema,
  fields: z.array(formFieldSchema).max(100).default([]),
});

export type FormDefinitionInput = z.infer<typeof formDefinitionSchema>;
