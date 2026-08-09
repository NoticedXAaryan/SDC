"use client";

import React, { useState } from "react";
import { SideNav, SideNavSection, SideNavItem, SideNavHeading, Avatar, IconButton, useSideNavCollapse } from "@astryxdesign/core";
import { Text } from "@astryxdesign/core/Text";

import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  DollarSign, 
  Settings,
  Archive,
  Trophy,
  CheckSquare,
  Box,
  Megaphone,
  Briefcase,
  QrCode,
  ClipboardList,
  ShoppingCart,
  Shield,
  Activity,
  Search,
  Moon,
  Sun,
  ChevronDown,
  ChevronRight,
  Plus
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { NotificationBell } from "@/components/notifications/notification-bell";


interface AppSideNavProps {
  role?: string;
  user?: {
    name: string;
    image?: string | null;
  };
}

export function CollapsibleNavItem({ 
  icon, 
  label, 
  activeRoutes = [], 
  children,
  defaultExpanded = false
}: { 
  icon: React.ReactNode; 
  label: string; 
  activeRoutes: string[]; 
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const pathname = usePathname() || "";
  const isActive = activeRoutes.some(r => pathname.startsWith(r));
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || isActive);

  const { isCollapsed } = useSideNavCollapse();

  // Auto-close when sidebar collapses
  React.useEffect(() => {
    if (isCollapsed && isExpanded) {
      setIsExpanded(false);
    }
  }, [isCollapsed]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <button 
        onClick={() => {
          if (!isCollapsed) setIsExpanded(!isExpanded);
        }}
        className={`flex items-center justify-between w-full p-2 text-sm rounded-md transition-colors ${
          isActive && !isExpanded 
            ? "bg-primary/10 text-primary font-medium" 
            : "hover:bg-muted text-muted-foreground hover:text-foreground"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? label : undefined}
      >
        <div className="flex items-center gap-2">
          {icon}
          {!isCollapsed && <span>{label}</span>}
        </div>
        {!isCollapsed && (isExpanded ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronRight className="w-4 h-4 opacity-50" />)}
      </button>
      
      {!isCollapsed && isExpanded && (
        <div className="flex flex-col gap-1 pl-6 ml-2 border-l border-border mt-1">
          {children}
        </div>
      )}
    </div>
  );
}

export function AppSideNav({ role = "member", user }: AppSideNavProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const isAdmin = ["admin", "owner"].includes(role);
  const isFinance = isAdmin || role === "finance_lead";
  const isManagement = isAdmin || [
    "lead", "co_lead", "vice_lead", "event_lead", 
    "tech_lead", "finance_lead", "marketing_lead", 
    "content_lead", "volunteer_lead"
  ].includes(role);

  return (
    <SideNav 
      collapsible 
      resizable={{ autoSaveId: "sdc-sidenav" }}
      header={
        <SideNavHeading 
          icon={null}
          heading="Student Developer Club"
        />
      }
      footerIcons={
        <div className="flex flex-row items-center justify-around w-full py-2 border-t border-border mt-auto overflow-hidden">
          <IconButton
            icon={theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            label="Toggle theme"
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
          <NotificationBell />
          {user && (
            <Avatar
              name={user.name}
              src={user.image || undefined}
              size="sm"
            />
          )}
        </div>
      }
    >
      {/* ── Everyone: core member features ── */}
      <SideNavSection title="Main" isHeaderHidden>
        <SideNavItem 
          href="#" 
          icon={<Search className="w-4 h-4" />} 
          label="Search (⌘K)" 
          onClick={(e) => {
            e.preventDefault();
            const event = new KeyboardEvent("keydown", { metaKey: true, key: "k" });
            document.dispatchEvent(event);
          }}
        />
        <SideNavItem 
          href="/dashboard" 
          icon={<Home className="w-4 h-4" />} 
          label="Dashboard" 
          isSelected={pathname === "/dashboard"}
        />
        
        <CollapsibleNavItem 
          icon={<Calendar className="w-4 h-4" />} 
          label="Events" 
          activeRoutes={["/events"]}
        >
          <SideNavItem 
            href="/events" 
            icon={<Search className="w-4 h-4" />} 
            label="Browse Events" 
            isSelected={pathname === "/events"}
          />
          {isManagement && (
            <SideNavItem 
              href="/events/create" 
              icon={<Plus className="w-4 h-4" />} 
              label="Create Event" 
              isSelected={pathname === "/events/create"}
            />
          )}
        </CollapsibleNavItem>
        <SideNavItem 
          href="/leaderboard" 
          icon={<Trophy className="w-4 h-4" />} 
          label="Leaderboard" 
          isSelected={pathname === "/leaderboard"}
        />
        <SideNavItem 
          href="/achievements" 
          icon={<CheckSquare className="w-4 h-4" />} 
          label="Achievements" 
          isSelected={pathname === "/achievements"}
        />
        <SideNavItem 
          href="/certificates" 
          icon={<FileText className="w-4 h-4" />} 
          label="My Certificates" 
          isSelected={pathname === "/certificates"}
        />
        <SideNavItem 
          href="/internal-projects" 
          icon={<Briefcase className="w-4 h-4" />} 
          label="Projects" 
          isSelected={pathname?.startsWith("/internal-projects")}
        />
        <SideNavItem 
          href="/communications" 
          icon={<Megaphone className="w-4 h-4" />} 
          label="Announcements" 
          isSelected={pathname?.startsWith("/communications")}
        />
      </SideNavSection>

      {/* ── Leads + Admin: operational management tools ── */}
      {isManagement && (
        <SideNavSection title="Management">
          <SideNavItem 
            href="/manage/approvals" 
            icon={<ClipboardList className="w-4 h-4" />} 
            label="Approvals" 
            isSelected={pathname?.startsWith("/manage/approvals")}
          />
          <SideNavItem 
            href="/manage/recruitment" 
            icon={<Users className="w-4 h-4" />} 
            label="Recruitment" 
            isSelected={pathname?.startsWith("/manage/recruitment") || pathname?.startsWith("/recruitment")}
          />
          <SideNavItem 
            href="/manage/forms" 
            icon={<FileText className="w-4 h-4" />} 
            label="Forms" 
            isSelected={pathname?.startsWith("/manage/forms")}
          />
          <CollapsibleNavItem 
            icon={<Calendar className="w-4 h-4" />} 
            label="Events Management" 
            activeRoutes={["/manage/events", "/scanner"]}
          >
            <SideNavItem 
              href="/manage/events" 
              icon={<Calendar className="w-4 h-4" />} 
              label="Manage Events" 
              isSelected={pathname?.startsWith("/manage/events")}
            />
            <SideNavItem 
              href="/scanner" 
              icon={<QrCode className="w-4 h-4" />} 
              label="Check-in Scanner" 
              isSelected={pathname?.startsWith("/scanner")}
            />
          </CollapsibleNavItem>
        </SideNavSection>
      )}

      {/* ── Finance Lead + Admin: finance tools ── */}
      {isFinance && (
        <SideNavSection title="Finance">
          <SideNavItem 
            href="/finance/budget" 
            icon={<DollarSign className="w-4 h-4" />} 
            label="Budgeting" 
            isSelected={pathname?.startsWith("/finance/budget")}
          />
          <SideNavItem 
            href="/finance/expenses" 
            icon={<FileText className="w-4 h-4" />} 
            label="Expenses" 
            isSelected={pathname?.startsWith("/finance/expenses")}
          />
          <SideNavItem 
            href="/finance/procurement" 
            icon={<ShoppingCart className="w-4 h-4" />} 
            label="Procurement" 
            isSelected={pathname?.startsWith("/finance/procurement")}
          />
        </SideNavSection>
      )}

      {/* ── Admin/Owner only: system administration ── */}
      {isAdmin && (
        <SideNavSection title="Administration">
          <SideNavItem 
            href="/admin/members" 
            icon={<Users className="w-4 h-4" />} 
            label="Members" 
            isSelected={pathname?.startsWith("/admin/members")}
          />
          <SideNavItem 
            href="/admin/inventory" 
            icon={<Box className="w-4 h-4" />} 
            label="Inventory" 
            isSelected={pathname?.startsWith("/admin/inventory")}
          />
          <SideNavItem 
            href="/admin/certificates" 
            icon={<Shield className="w-4 h-4" />} 
            label="Certificate Templates" 
            isSelected={pathname?.startsWith("/admin/certificates")}
          />
          <SideNavItem 
            href="/admin/projects" 
            icon={<Briefcase className="w-4 h-4" />} 
            label="Master Projects" 
            isSelected={pathname?.startsWith("/admin/projects")}
          />
          <SideNavItem 
            href="/admin/finance" 
            icon={<DollarSign className="w-4 h-4" />} 
            label="Finance Overview" 
            isSelected={pathname?.startsWith("/admin/finance")}
          />
          <SideNavItem 
            href="/admin/audit" 
            icon={<Activity className="w-4 h-4" />} 
            label="Audit Logs" 
            isSelected={pathname?.startsWith("/admin/audit")}
          />
        </SideNavSection>
      )}

      {/* ── Everyone: system/utility ── */}
      <SideNavSection title="System" isHeaderHidden>
        <SideNavItem 
          href="/archive" 
          icon={<Archive className="w-4 h-4" />} 
          label="Archive" 
          isSelected={pathname?.startsWith("/archive")}
        />
        <SideNavItem 
          href="/settings" 
          icon={<Settings className="w-4 h-4" />} 
          label="Settings" 
          isSelected={pathname?.startsWith("/settings")}
        />
      </SideNavSection>
    </SideNav>
  );
}
