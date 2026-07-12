import { requireSession } from "@/lib/dal/auth";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/achievements", label: "Hall of Fame" },
  { href: "/recruitment/apply", label: "Apply" },
];

const leadNavItems = [
  { href: "/scanner", label: "QR Scanner" },
  { href: "/scanner/face", label: "Face Scanner" },
  { href: "/lead/certificates", label: "Certificates" },
  { href: "/recruitment/interviews", label: "Interviews" },
  { href: "/inventory", label: "Inventory" },
  { href: "/finance/budget", label: "Finance" },
  { href: "/admin/audit", label: "Audit Logs" },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Link href="/dashboard" className="font-semibold text-lg">STC OS</Link>
        <div className="ml-auto flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">{session.user.role}</span>
          <span className="text-sm font-medium">{session.user.email}</span>
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
            <p className="px-3 py-2 mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Management</p>
            {leadNavItems.map(item => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

