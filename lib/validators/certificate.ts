import { z } from "zod";

// ─── Certificate Issue Command ─────────────────────────────────────────────

export const issueCertificatesSchema = z.object({
  eventId: z.string().min(1, "Event ID required"),
  templateId: z.string().min(1, "Template ID required").optional(),
});

export type IssueCertificatesInput = z.infer<typeof issueCertificatesSchema>;

export const issueAdhocCertificatesSchema = z.object({
  templateId: z.string().min(1, "Template ID required"),
  userIds: z.array(z.string().min(1)).min(1, "At least one user ID required").max(500),
  eventId: z.string().optional().nullable(),
  /** Caller-supplied idempotency key; prevents duplicate issuance on retry */
  idempotencyKey: z.string().max(128).optional(),
});

export type IssueAdhocCertificatesInput = z.infer<typeof issueAdhocCertificatesSchema>;

// ─── Certificate Revoke Command ─────────────────────────────────────────────

export const revokeCertificateSchema = z.object({
  certificateId: z.string().min(1),
  reason: z.string().min(5, "Provide a reason of at least 5 characters").max(500),
});

export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;

// ─── Certificate Template ──────────────────────────────────────────────────

export const createCertTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  eventId: z.string().optional().nullable(),
  backgroundUrl: z.string().refine(
    (value) => value.startsWith("/uploads/") || z.string().url().safeParse(value).success,
    "Must be an uploaded file path or valid URL"
  ),
  fields: z.array(z.array(z.record(z.string(), z.unknown()))).default([[]]),
});

export type CreateCertTemplateInput = z.infer<typeof createCertTemplateSchema>;
