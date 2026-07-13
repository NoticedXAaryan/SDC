export interface NavItem {
  href: string;
  label: string;
  roles?: string[]; // If undefined, available to all
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/achievements", label: "Hall of Fame" },
  { href: "/recruitment/apply", label: "Apply" },
  { href: "/settings", label: "Settings" },
];

export const managementNavItems: NavItem[] = [
  { href: "/applications", label: "Applications", roles: ["vice_lead", "lead", "admin", "owner"] },
  { href: "/scanner", label: "QR Scanner", roles: ["event_lead", "volunteer_lead", "co_lead", "lead", "admin", "owner"] },
  { href: "/lead/certificates", label: "Certificates", roles: ["event_lead", "lead", "admin", "owner"] },
  { href: "/recruitment/interviews", label: "Interviews", roles: ["vice_lead", "lead", "admin", "owner"] },
  { href: "/inventory", label: "Inventory", roles: ["tech_lead", "co_lead", "finance_lead", "lead", "admin", "owner"] },
  { href: "/finance/budget", label: "Finance", roles: ["finance_lead", "lead", "admin", "owner", "faculty_coordinator"] },
  { href: "/admin/audit", label: "Audit Logs", roles: ["admin", "owner", "faculty_coordinator"] },
  { href: "/admin/members", label: "Members", roles: ["lead", "admin", "owner"] },
];
