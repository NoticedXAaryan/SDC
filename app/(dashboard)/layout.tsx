import { requireSession } from "@/lib/dal/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CommandMenu } from "@/components/app/command-menu";
import { DynamicBreadcrumbs } from "@/components/app/breadcrumbs";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

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
  const username = (session.user as any).username || "user";
  const initials = session.user.name?.substring(0, 2).toUpperCase() || "US";

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-screen w-full flex-col bg-muted/30">
        {/* Enhanced header with glassmorphism */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          
          {/* Breadcrumbs */}
          <div className="flex-1 flex items-center gap-4">
            <DynamicBreadcrumbs />
          </div>

          {/* Command Menu (centered) */}
          <div className="flex-1 flex justify-center max-w-md">
            <CommandMenu />
          </div>

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
            
            <Separator orientation="vertical" className="h-6 mx-1" />

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="relative flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                  <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-none">{session.user.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">{getRoleLabel(userRole)}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-3 p-3 border-b">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5 leading-none">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">@{username}</p>
                    <span className="mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {getRoleLabel(userRole)}
                    </span>
                  </div>
                </div>
                <DropdownMenuItem>
                  <Link href="/settings" className="w-full flex items-center cursor-pointer">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
