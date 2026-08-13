"use client";

import React, { useState } from "react";
import { SideNav, SideNavSection, SideNavItem, SideNavHeading, Avatar, useSideNavCollapse } from "@astryxdesign/core";
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Settings,
  Archive,
  Trophy,
  Briefcase,
  QrCode,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Plus,
  MessageSquare,
  Compass,
  Moon,
  Sun,
  Wallet,
  Award,
  Box,
  Bell,
  Shield,
  Star,
  Mail,
  LogOut
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";

interface AppSideNavProps {
  role?: string;
  user?: {
    name: string;
    image?: string | null;
    role?: string;
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
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const isAdmin = ["admin", "owner"].includes(role);
  const isManagement = isAdmin || [
    "lead", "co_lead", "vice_lead", "event_lead", 
    "tech_lead", "finance_lead", "marketing_lead", 
    "content_lead", "volunteer_lead"
  ].includes(role);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <SideNav 
      collapsible 
      resizable={{ autoSaveId: "sdc-sidenav" }}
      header={
        <SideNavHeading 
          icon={<Compass className="w-5 h-5 text-primary" />}
          heading="Club Hub"
        />
      }
      footer={
        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-row items-center justify-between w-full p-2 rounded-lg bg-card border border-border overflow-hidden hover:bg-muted transition-colors cursor-pointer group relative">
            <Link href="/settings" className="absolute inset-0 z-10" />
            <div className="flex items-center gap-3">
              <Avatar
                name={user?.name || "User"}
                src={user?.image || undefined}
                size="sm"
              />
              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-sm font-medium leading-none truncate w-24">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground mt-1 truncate w-24">
                  {role.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        </div>
      }
    >
      {/* ── Navigate Section ── */}
      <SideNavSection title="Navigate">
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
            icon={<Compass className="w-4 h-4" />} 
            label="Browse" 
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
          href="/internal-projects" 
          icon={<Briefcase className="w-4 h-4" />} 
          label="Projects" 
          isSelected={pathname?.startsWith("/internal-projects")}
        />

        <SideNavItem 
          href="/forms" 
          icon={<FileText className="w-4 h-4" />} 
          label="Forms" 
          isSelected={pathname?.startsWith("/forms")}
        />

        <SideNavItem 
          href="/leaderboard" 
          icon={<Trophy className="w-4 h-4" />} 
          label="Leaderboard" 
          isSelected={pathname === "/leaderboard"}
        />

        <SideNavItem 
          href="/achievements" 
          icon={<Star className="w-4 h-4" />} 
          label="Achievements" 
          isSelected={pathname?.startsWith("/achievements")}
        />

        <SideNavItem 
          href="/applications" 
          icon={<Users className="w-4 h-4" />} 
          label="Applications" 
          isSelected={pathname?.startsWith("/applications")}
        />
      </SideNavSection>

      {/* ── Management Section ── */}
      {isManagement && (
        <SideNavSection title="Management">
          <SideNavItem 
            href="/manage/approvals" 
            icon={<ClipboardList className="w-4 h-4" />} 
            label="Approvals" 
            isSelected={pathname?.startsWith("/manage/approvals")}
          />

          <SideNavItem 
            href="/finance" 
            icon={<Wallet className="w-4 h-4" />} 
            label="Finance" 
            isSelected={pathname?.startsWith("/finance")}
          />

          <SideNavItem 
            href="/certificates" 
            icon={<Award className="w-4 h-4" />} 
            label="Certificates" 
            isSelected={pathname?.startsWith("/certificates")}
          />

          <SideNavItem 
            href="/inventory" 
            icon={<Box className="w-4 h-4" />} 
            label="Inventory" 
            isSelected={pathname?.startsWith("/inventory")}
          />

          <SideNavItem 
            href="/communications" 
            icon={<Mail className="w-4 h-4" />} 
            label="Communications" 
            isSelected={pathname?.startsWith("/communications")}
          />

          <SideNavItem 
            href="/manage/recruitment" 
            icon={<Users className="w-4 h-4" />} 
            label="Recruitment" 
            isSelected={pathname?.startsWith("/manage/recruitment") || pathname?.startsWith("/recruitment")}
          />

          <SideNavItem 
            href="/scanner" 
            icon={<QrCode className="w-4 h-4" />} 
            label="Check-in Scanner" 
            isSelected={pathname?.startsWith("/scanner")}
          />
        </SideNavSection>
      )}

      {/* ── Admin Section ── */}
      {isAdmin && (
        <SideNavSection title="Admin">
          <SideNavItem 
            href="/admin" 
            icon={<Shield className="w-4 h-4" />} 
            label="Admin Panel" 
            isSelected={pathname?.startsWith("/admin")}
          />
        </SideNavSection>
      )}

      {/* ── More Section ── */}
      <SideNavSection title="More">
        <SideNavItem 
          href="/notifications" 
          icon={<Bell className="w-4 h-4" />} 
          label="Notifications" 
          isSelected={pathname?.startsWith("/notifications")}
        />

        <SideNavItem 
          href="/settings" 
          icon={<Settings className="w-4 h-4" />} 
          label="Settings" 
          isSelected={pathname?.startsWith("/settings")}
        />

        <SideNavItem 
          href="/archive" 
          icon={<Archive className="w-4 h-4" />} 
          label="Archive" 
          isSelected={pathname?.startsWith("/archive")}
        />

        <SideNavItem 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          icon={theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />} 
          label={theme === "dark" ? "Light Mode" : "Dark Mode"} 
        />

        <SideNavItem 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
          icon={<LogOut className="w-4 h-4" />} 
          label="Sign Out" 
        />
      </SideNavSection>
    </SideNav>
  );
}
