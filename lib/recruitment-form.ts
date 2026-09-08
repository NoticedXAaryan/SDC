import { z } from "zod";
import { usernameError } from "@/lib/username-policy";
const fieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  question: z.string().optional(),
  type: z.enum(["text", "textarea", "email", "tel", "url", "select", "radio", "multiselect", "number", "checkbox", "file", "username"]),
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  options: z.array(z.union([z.string(), z.object({ label: z.string(), value: z.string() })])).optional(),
}).refine(field => !!(field.label || field.question), "Every question needs a label.");
export const recruitmentFieldsSchema = z.array(fieldSchema).min(1).max(40).refine(fields => new Set(fields.map(field => field.id)).size === fields.length, "Question IDs must be unique.").refine(fields => fields.filter(field => field.type === "file").length <= 1, "Use one résumé question per form.");
export type RecruitmentField = z.infer<typeof fieldSchema>;
/** Required enrollment steps cannot be removed by a legacy/custom form. */
export function enrollmentFields(fields: RecruitmentField[]): RecruitmentField[] {
  const result = fields.filter(field => field.id !== "requestedUsername").map(field => field.type === "file" ? { ...field, required: true, description: "Upload your CV as a PDF, up to 2 MB. Only you and authorized reviewers can download it." } : field);
  if (!result.some(field => field.type === "file")) {
    let id = "resume";
    while (result.some(field => field.id === id)) id += "_file";
    result.push({ id, label: "Add your CV", type: "file", required: true, description: "Upload your CV as a PDF, up to 2 MB. Only you and authorized reviewers can download it." });
  }
  result.push({ id: "requestedUsername", label: "Choose your member username", type: "username", required: true, description: "This is a request until approved. Your approved username is permanent and visible only to club members." });
  return result;
}
export const resumeAnswerSchema = z.object({ id: z.uuid(), name: z.string().min(1).max(150), size: z.number().int().positive().max(2 * 1024 * 1024) });
export function validateRecruitmentAnswers(fields: RecruitmentField[], answers: Record<string, unknown>) {
  for (const field of fields) {
    const value = answers[field.id];
    const empty = value == null || value === "" || (Array.isArray(value) && value.length === 0) || (field.type === "checkbox" && value !== true);
    const label = field.label || field.question;
    if (empty) { if (field.required) return `Complete “${label}”.`; continue; }
    if (field.type === "username") { const error = usernameError(value); if (error) return error; continue; }
    if (field.type === "file") { if (!resumeAnswerSchema.safeParse(value).success) return `Upload a PDF for “${label}”.`; continue; }
    if (field.type === "checkbox") { if (typeof value !== "boolean") return `Check “${label}”.`; continue; }
    if (field.type === "multiselect") {
      const allowed = field.options?.map(option => typeof option === "string" ? option : option.value) || [];
      if (!Array.isArray(value) || value.some(item => !allowed.includes(item))) return `Choose valid options for “${label}”.`;
      continue;
    }
    if (typeof value !== "string" || !value.trim() || value.length > 5000) return `Enter a valid answer for “${label}” (up to 5,000 characters).`;
    if (["select", "radio"].includes(field.type) && !field.options?.some(option => (typeof option === "string" ? option : option.value) === value)) return `Choose a valid option for “${label}”.`;
    if (field.type === "email" && !z.email().safeParse(value).success) return `Enter a valid email for “${label}”.`;
    if (field.type === "number" && !Number.isFinite(Number(value))) return `Enter a number for “${label}”.`;
    if (field.type === "url") { try { if (!["http:", "https:"].includes(new URL(value).protocol)) return `Use an HTTP or HTTPS link for “${label}”.`; } catch { return `Enter a full link for “${label}”.`; } }
  }
  return null;
}
