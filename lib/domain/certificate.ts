export const CERTIFICATE_DESIGNER_ROLES = [
  "owner",
  "admin",
  "lead",
  "co_lead",
  "event_lead",
  "content_lead",
  "tech_lead",
] as const;

export const CERTIFICATE_ISSUER_ROLES = [
  "owner",
  "admin",
  "lead",
  "vice_lead",
  "co_lead",
  "event_lead",
] as const;

export function canDesignCertificates(role: string): boolean {
  return (CERTIFICATE_DESIGNER_ROLES as readonly string[]).includes(role);
}

export function canIssueCertificates(role: string): boolean {
  return (CERTIFICATE_ISSUER_ROLES as readonly string[]).includes(role);
}

/** Event operations is a cross-functional role and is not limited to one event domain. */
export function canIssueCertificatesAcrossDomains(role: string): boolean {
  return role === "owner" || role === "admin" || role === "event_lead";
}

/** Certificate production is shared club infrastructure, not an event-domain silo. */
export function canDesignCertificatesAcrossDomains(role: string): boolean {
  return ["owner", "admin", "event_lead", "content_lead", "tech_lead"].includes(role);
}
