import { requireSession, isManagementRole } from "@/lib/dal/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/achievements", label: "Hall of Fame" },
  { href: "/recruitment/apply", label: "Apply" },
];

const managementNavItems = [
  { href: "/applications", label: "Applications", roles: ["vice_lead", "lead", "admin", "owner"] },
  { href: "/scanner", label: "QR Scanner", roles: ["event_lead", "volunteer_lead", "co_lead", "lead", "admin", "owner"] },
  { href: "/lead/certificates", label: "Certificates", roles: ["event_lead", "lead", "admin", "owner"] },
  { href: "/recruitment/interviews", label: "Interviews", roles: ["vice_lead", "lead", "admin", "owner"] },
  { href: "/inventory", label: "Inventory", roles: ["tech_lead", "co_lead", "finance_lead", "lead", "admin", "owner"] },
  { href: "/finance/budget", label: "Finance", roles: ["finance_lead", "lead", "admin", "owner", "faculty_coordinator"] },
  { href: "/admin/audit", label: "Audit Logs", roles: ["admin", "owner", "faculty_coordinator"] },
  { href: "/admin/members", label: "Members", roles: ["lead", "admin", "owner"] },
];

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    lead: "President",
    vice_lead: "Vice President",
    event_lead: "Event Lead",
    content_lead: "Content Lead",
    marketing_lead: "Marketing Lead",
    tech_lead: "Tech Lead",
    finance_lead: "Finance Lead",
    volunteer_lead: "Volunteer Lead",
    co_lead: "Co-Lead",
    faculty_coordinator: "Faculty Coordinator",
    member: "Member",
    alumni: "Alumni",
    user: "Member",
  };
  return labels[role] || role;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const userRole = (session.user.role || "member") as string;
  const showManagement = isManagementRole(userRole);

  // Filter management items by the user's specific role
  const visibleManagementItems = managementNavItems.filter(
    item => item.roles.includes(userRole)
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/dashboard" className="font-semibold text-lg">STC OS</Link>
        <div className="ml-auto flex items-center space-x-4">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {getRoleLabel(userRole)}
          </span>
          <span className="text-sm font-medium">{session.user.name}</span>
          <SignOutButton />
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-64 flex-col border-r bg-background p-4 md:flex overflow-y-auto">
          <nav className="grid gap-1 text-sm font-medium">
            <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">General</p>
            {navItems.map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
            {showManagement && visibleManagementItems.length > 0 && (
              <>
                <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</p>
                {visibleManagementItems.map(item => (
                  <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                ))}
              </>
            )}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
