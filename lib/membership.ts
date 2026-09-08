const MEMBER_ROLES = new Set([
  "member", "alumni", "faculty_coordinator", "co_lead", "volunteer_lead",
  "finance_lead", "tech_lead", "marketing_lead", "content_lead", "event_lead",
  "vice_lead", "lead", "admin", "owner",
]);
export function isClubMember(role: string | null | undefined) {
  return MEMBER_ROLES.has(role || "");
}
export function membershipLabel(role: string | null | undefined) {
  if (role === "applicant") return "Applicant";
  if (!isClubMember(role)) return "Participant";
  if (role === "member") return "Member";
  return (role || "").split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
