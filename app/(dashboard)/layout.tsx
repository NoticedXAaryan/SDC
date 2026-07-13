import { requireSession, isManagementRole } from "@/lib/dal/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

import { navItems, managementNavItems } from "@/lib/config/nav";


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
  const userRole = (session.user.role || "user") as string;
  const showManagement = isManagementRole(userRole);
  
  // Extract initials for fallback
  const initials = session.user.name?.substring(0, 2).toUpperCase() || "US";

  // Filter management items by the user's specific role
  const visibleManagementItems = managementNavItems.filter(
    item => item.roles?.includes(userRole)
  );

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left font-semibold text-lg">SDC OS</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-1 p-4 text-sm font-medium overflow-y-auto">
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
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="hidden md:block font-semibold text-lg">SDC OS</Link>
        <div className="ml-auto flex items-center space-x-4">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
            {getRoleLabel(userRole)}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
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
