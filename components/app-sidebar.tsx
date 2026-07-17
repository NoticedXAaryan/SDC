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
  SidebarRail,
} from "@/components/ui/sidebar";
import { 
  Home, Calendar, Briefcase, Package, 
  Settings, Users, FileText, QrCode, 
  CreditCard, Inbox, ShieldCheck,
  Award, MessageSquare, Target, Activity, CheckSquare
} from "lucide-react";

export async function AppSidebar() {
  const session = await requireSession();
  const role = (session.user.role as string) || "member";
  
  const isAdmin = ["admin", "faculty_coordinator", "owner"].includes(role);
  const isLead = isAdmin || ["lead", "co_lead", "event_lead", "content_lead", "marketing_lead", "tech_lead", "finance_lead", "volunteer_lead", "vice_lead"].includes(role);
  const isMember = true;

  const navGroups = [
    {
      label: "My club",
      visible: isMember,
      items: [
        { title: "Home", href: "/dashboard", icon: Home },
        { title: "Events", href: "/events", icon: Calendar },
        { title: "My registrations", href: "/events/my-registrations", icon: CheckSquare },
        { title: "My pass", href: "/passes/me", icon: QrCode },
        { title: "Certificates", href: "/certificates", icon: Award },
        { title: "Achievements", href: "/achievements", icon: Target },
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
      <SidebarContent>
        {navGroups.filter(g => g.visible).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
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
      <SidebarRail />
    </Sidebar>
  );
}
