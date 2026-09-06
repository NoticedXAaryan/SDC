export interface NavItem {
  href: string;
  label: string;
  roles?: string[];
}
export interface NavGroup {
  label: string;
  items: NavItem[];
  secondary?: boolean;
}
const leadership = ["owner", "admin", "lead", "vice_lead", "co_lead"];
const eventManagers = ["owner", "admin", "lead", "co_lead", "event_lead"];

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/events", label: "Explore events" },
  { href: "/certificates", label: "My certificates" },
  { href: "/recruitment/apply", label: "Join the team", roles: ["user", "outsider", "applicant"] },
];
export const managementNavItems: NavItem[] = [
  { href: "/events/create", label: "Create event", roles: eventManagers },
  { href: "/tasks", label: "Team tasks", roles: [...leadership, "event_lead", "tech_lead", "finance_lead", "marketing_lead", "content_lead", "volunteer_lead"] },
  { href: "/applications", label: "Applications", roles: leadership },
  { href: "/manage/forms", label: "Manage forms", roles: [...leadership, "content_lead", "event_lead"] },
  { href: "/scanner", label: "Event check-in", roles: [...eventManagers, "volunteer_lead"] },
  { href: "/lead/certificates", label: "Issue certificates", roles: [...eventManagers, "content_lead", "tech_lead"] },
  { href: "/lead/achievements", label: "Review achievements", roles: ["owner", "admin", "lead", "event_lead"] },
  { href: "/lead/content", label: "Content calendar", roles: ["owner", "admin", "lead", "content_lead"] },
  { href: "/recruitment/interviews", label: "Interviews", roles: leadership },
  { href: "/inventory", label: "Inventory", roles: ["owner", "admin", "lead", "co_lead", "finance_lead", "tech_lead"] },
  { href: "/finance", label: "Finance", roles: ["owner", "admin", "lead", "vice_lead", "finance_lead", "faculty_coordinator"] },
  { href: "/finance/procurement", label: "Procurement", roles: ["owner", "admin", "lead", "finance_lead", "faculty_coordinator"] },
  { href: "/manage/recruitment", label: "Recruitment", roles: leadership },
  { href: "/manage/approvals", label: "Approvals", roles: ["owner", "admin"] },
];
const groups: NavGroup[] = [
  { label: "Your club", items: navItems },
  { label: "Community", secondary: true, items: [
    { href: "/internal-projects", label: "Projects" },
    { href: "/forms", label: "Forms" },
    { href: "/achievements", label: "Achievements" },
    { href: "/leaderboard", label: "Leaderboard" },
  ] },
  { label: "Manage", secondary: true, items: managementNavItems },
  { label: "Administration", secondary: true, items: [
    { href: "/admin/members", label: "Members", roles: ["owner", "admin"] },
    { href: "/admin/audit", label: "Audit log", roles: ["owner", "admin", "faculty_coordinator"] },
    { href: "/admin", label: "Administration", roles: ["owner", "admin"] },
  ] },
  { label: "Account", items: [
    { href: "/notifications", label: "Notifications" },
    { href: "/settings", label: "Profile & settings" },
  ] },
];
/** Shared by desktop, mobile, and search. This is navigation, not authorization. */
export function getNavigation(role: string): NavGroup[] {
  return groups.map(group => ({
    ...group,
    items: group.items.filter(item => !item.roles || item.roles.includes(role)),
  })).filter(group => group.items.length > 0);
}
export function isActiveDestination(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
}
