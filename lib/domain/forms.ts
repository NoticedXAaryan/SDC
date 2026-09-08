export const FORM_DESIGNER_ROLES = [
  "owner",
  "admin",
  "lead",
  "vice_lead",
  "co_lead",
  "event_lead",
  "content_lead",
] as const;

export function canDesignForms(role: string | null | undefined): boolean {
  return FORM_DESIGNER_ROLES.includes(
    role as (typeof FORM_DESIGNER_ROLES)[number],
  );
}
