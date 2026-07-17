import { requireSession, isManagementRole } from "@/lib/dal/auth";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { CommandMenu } from "@/components/app/command-menu";
import { DynamicBreadcrumbs } from "@/components/app/breadcrumbs";
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
  const username = (session.user as any).username || "user"; // Fallback until username is added
  
  // Extract initials for fallback
  const initials = session.user.name?.substring(0, 2).toUpperCase() || "US";

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          
          <div className="flex-1 flex items-center gap-4">
            <DynamicBreadcrumbs />
          </div>

          <div className="flex-1 flex justify-center">
            <CommandMenu />
          </div>

          <div className="ml-auto flex items-center space-x-4">
            <NotificationBell />
            
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <span className="sr-only">Toggle theme</span>
              {/* Theme icon placeholder */}
              <div className="h-4 w-4 rounded-full border border-current" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || "User"} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-sm text-muted-foreground">@{username}</p>
                    <div className="mt-1">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                        {getRoleLabel(userRole)}
                      </span>
                    </div>
                  </div>
                </div>
                <DropdownMenuItem>
                  <Link href="/settings/profile" className="w-full h-full flex items-center">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SignOutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
