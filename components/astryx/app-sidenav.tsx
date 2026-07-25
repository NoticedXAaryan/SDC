"use client";

import React from "react";
import { SideNav, SideNavSection, SideNavItem, SideNavHeading } from "@astryxdesign/core";
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
  Briefcase
} from "lucide-react";
import { usePathname } from "next/navigation";

interface AppSideNavProps {
  role?: string;
}

export function AppSideNav({ role = "member" }: AppSideNavProps) {
  const pathname = usePathname();
  
  const isManagement = ["admin", "owner", "lead", "finance_lead", "event_lead", "tech_lead"].includes(role);
  const isAdmin = ["admin", "owner"].includes(role);
  const isFinance = isAdmin || role === "finance_lead";
  const isLead = isAdmin || ["lead", "event_lead", "tech_lead", "finance_lead"].includes(role);

  return (
    <SideNav collapsible resizable={{ autoSaveId: "sdc-sidenav" }}>
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
      </SideNavSection>

      <SideNavSection title="Operations">
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

      {isManagement && (
        <SideNavSection title="Management">
          <SideNavItem 
            href="/manage/approvals" 
            icon={<CheckSquare className="w-4 h-4" />} 
          label="Approvals" 
          isSelected={pathname?.startsWith("/manage/approvals")}
        />
          <SideNavItem 
            href="/manage/recruitment" 
            icon={<Users className="w-4 h-4" />} 
          label="Recruitment" 
          isSelected={pathname?.startsWith("/manage/recruitment")}
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
            href="/manage/settings" 
            icon={<Settings className="w-4 h-4" />} 
          label="Management Settings" 
          isSelected={pathname?.startsWith("/manage/settings")}
        />
        </SideNavSection>
      )}

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
            icon={<Box className="w-4 h-4" />} 
          label="Procurement" 
          isSelected={pathname?.startsWith("/finance/procurement")}
        />
        </SideNavSection>
      )}

      {isLead && (
        <SideNavSection title="Department">
          <SideNavItem 
            href="/lead/achievements" 
            icon={<CheckSquare className="w-4 h-4" />} 
          label="Lead Achievements" 
          isSelected={pathname?.startsWith("/lead/achievements")}
        />
          <SideNavItem 
            href="/lead/certificates" 
            icon={<FileText className="w-4 h-4" />} 
          label="Lead Certificates" 
          isSelected={pathname?.startsWith("/lead/certificates")}
        />
          <SideNavItem 
            href="/lead/content" 
            icon={<Megaphone className="w-4 h-4" />} 
          label="Lead Content" 
          isSelected={pathname?.startsWith("/lead/content")}
        />
        </SideNavSection>
      )}

      {isAdmin && (
        <SideNavSection title="Administration">
          <SideNavItem 
            href="/admin/members" 
            icon={<Users className="w-4 h-4" />} 
          label="Members" 
          isSelected={pathname?.startsWith("/admin/members")}
        />
          <SideNavItem 
            href="/admin/finance" 
            icon={<DollarSign className="w-4 h-4" />} 
          label="Finance" 
          isSelected={pathname?.startsWith("/admin/finance")}
        />
          <SideNavItem 
            href="/admin/inventory" 
            icon={<Box className="w-4 h-4" />} 
          label="Inventory" 
          isSelected={pathname?.startsWith("/admin/inventory")}
        />
          <SideNavItem 
            href="/admin/audit" 
            icon={<FileText className="w-4 h-4" />} 
          label="Audit Logs" 
          isSelected={pathname?.startsWith("/admin/audit")}
        />
          <SideNavItem 
            href="/admin/certificates" 
            icon={<FileText className="w-4 h-4" />} 
          label="Certificates" 
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
        </SideNavSection>
      )}

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
