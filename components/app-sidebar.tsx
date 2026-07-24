import { requireSession } from "@/lib/dal/auth";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { 
  Home, Calendar, Briefcase, Package, 
  Settings, Users, FileText, QrCode, 
  CreditCard, Inbox, ShieldCheck,
  Award, MessageSquare, Target, Activity, CheckSquare,
  Layers, BarChart3
} from "lucide-react";

export async function AppSidebar() {
  const session = await requireSession();
  const role = (session.user.role as string) || "member";
  
  const isAdmin = ["admin", "faculty_coordinator", "owner"].includes(role);
  const isLead = isAdmin || ["lead", "co_lead", "event_lead", "content_lead", "marketing_lead", "tech_lead", "finance_lead", "volunteer_lead", "vice_lead"].includes(role);

  const navGroups = [
    {
      label: "My club",
      visible: true,
      items: [
        { title: "Home", href: "/dashboard", icon: Home },
        { title: "Events", href: "/events", icon: Calendar },
        { title: "My registrations", href: "/events/my-registrations", icon: CheckSquare },
        { title: "My pass", href: "/passes/me", icon: QrCode },
        { title: "Certificates", href: "/certificates", icon: Award },
        { title: "Achievements", href: "/achievements", icon: Target },
        { title: "Leaderboard", href: "/leaderboard", icon: BarChart3 },
        { title: "Feedback", href: "/forms/feedback", icon: MessageSquare },
      ]
    },
    {
      label: "Operations",
      visible: isLead,
      items: [
        { title: "Work queue", href: "/manage/queue", icon: Inbox },
        { title: "Events", href: "/manage/events", icon: Calendar },
        { title: "Scanner", href: "/scanner", icon: QrCode },
        { title: "Communications", href: "/communications", icon: MessageSquare },
        { title: "Forms", href: "/manage/forms", icon: FileText },
        { title: "Recruitment", href: "/manage/recruitment", icon: Briefcase },
      ]
    },
    {
      label: "Resources",
      visible: isLead,
      items: [
        { title: "Projects", href: "/manage/projects", icon: Target },
        { title: "Inventory", href: "/manage/inventory", icon: Package },
        { title: "Finance", href: "/manage/finance", icon: CreditCard },
        { title: "Content calendar", href: "/manage/content", icon: Calendar },
      ]
    },
    {
      label: "Administration",
      visible: isAdmin,
      items: [
        { title: "Approvals", href: "/admin/approvals", icon: CheckSquare },
        { title: "Members", href: "/admin/members", icon: Users },
        { title: "Certificate templates", href: "/admin/certificates/templates", icon: ShieldCheck },
        { title: "Audit log", href: "/admin/audit", icon: Activity },
        { title: "Settings", href: "/admin/settings", icon: Settings },
        { title: "System health", href: "/admin/health", icon: Activity },
      ]
    }
  ];

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background font-bold text-sm transition-transform group-hover:scale-105">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight leading-none">SDC OS</span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Student Developer Club</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {navGroups.filter(g => g.visible).map((group, idx) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/70 px-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4 text-muted-foreground/70" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-4 py-3 border-t border-border/40">
        <div className="flex items-center gap-2 text-xs text-muted-foreground/50">
          <Layers className="h-3 w-3" />
          <span>v2.1 · Powered by Astryx</span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
