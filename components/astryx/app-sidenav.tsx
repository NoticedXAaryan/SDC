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
  
  const isManagement = ["admin", "lead", "finance_lead", "event_lead", "tech_lead"].includes(role);
  const isAdmin = role === "admin";

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
