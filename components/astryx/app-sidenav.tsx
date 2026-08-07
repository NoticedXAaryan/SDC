"use client";

import React from "react";
import { SideNav, SideNavSection, SideNavItem } from "@astryxdesign/core";
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
  Activity
} from "lucide-react";
import { usePathname } from "next/navigation";

interface AppSideNavProps {
  role?: string;
}

export function AppSideNav({ role = "member" }: AppSideNavProps) {
  const pathname = usePathname();
  
  const isAdmin = ["admin", "owner"].includes(role);
  const isFinance = isAdmin || role === "finance_lead";
  const isManagement = isAdmin || [
    "lead", "co_lead", "vice_lead", "event_lead", 
    "tech_lead", "finance_lead", "marketing_lead", 
    "content_lead", "volunteer_lead"
  ].includes(role);

  return (
    <SideNav collapsible resizable={{ autoSaveId: "sdc-sidenav" }}>
      {/* ── Everyone: core member features ── */}
      <SideNavSection title="Main" isHeaderHidden>
        <SideNavItem 
          href="/dashboard" 
          icon={<Home className="w-4 h-4" />} 
          label="Dashboard" 
          isSelected={pathname === "/dashboard"}
        />
        <SideNavItem 
          href="/events" 
          icon={<Calendar className="w-4 h-4" />} 
          label="Events" 
          isSelected={pathname?.startsWith("/events")}
        />
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
          <SideNavItem 
            href="/manage/events" 
            icon={<Calendar className="w-4 h-4" />} 
            label="Event Admin" 
            isSelected={pathname?.startsWith("/manage/events")}
          />
          <SideNavItem 
            href="/scanner" 
            icon={<QrCode className="w-4 h-4" />} 
            label="Scanner" 
            isSelected={pathname?.startsWith("/scanner")}
          />
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
            href="/admin/forms" 
            icon={<FileText className="w-4 h-4" />} 
            label="Dynamic Forms" 
            isSelected={pathname?.startsWith("/admin/forms")}
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
