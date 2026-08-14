"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Calendar, QrCode, Wallet, Award, Users,
  Trophy, FolderKanban, FileText, Settings, LogOut,
  ChevronLeft, Shield, MessageSquare, BookOpen, Box, Menu
} from "lucide-react";
import { useState } from "react";

const MANAGEMENT_ROLES = [
  "co_lead", "volunteer_lead", "finance_lead", "tech_lead",
  "marketing_lead", "content_lead", "event_lead", "faculty_coordinator",
  "vice_lead", "lead", "admin", "owner"
];
const ADMIN_ROLES = ["admin", "owner"];

const allNavItems = [
  { name: "Overview", href: "/dashboard", icon: BookOpen, req: "all" },
  { name: "Events", href: "/events", icon: Calendar, req: "all" },
  { name: "Scanner", href: "/scanner", icon: QrCode, req: "management" },
  { name: "Applications", href: "/applications", icon: Users, req: "all" },
  { name: "Finance", href: "/finance", icon: Wallet, req: "management" },
  { name: "Certificates", href: "/certificates", icon: Award, req: "management" },
  { name: "Inventory", href: "/inventory", icon: Box, req: "management" },
  { name: "Forms", href: "/forms", icon: FileText, req: "all" },
  { name: "Leaderboard", href: "/leaderboard", icon: Trophy, req: "all" },
  { name: "Projects", href: "/internal-projects", icon: FolderKanban, req: "all" },
  { name: "Announcements", href: "/notifications", icon: MessageSquare, req: "all" },
];

const bottomNav = [
  { name: "Admin", href: "/admin", icon: Shield, req: "admin" },
  { name: "Settings", href: "/settings", icon: Settings, req: "all" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const userRole = (session?.user as any)?.role || "member";
  const isManagement = MANAGEMENT_ROLES.includes(userRole);
  const isAdmin = ADMIN_ROLES.includes(userRole);

  const filteredNavItems = allNavItems.filter((item) => {
    if (item.req === "management") return isManagement;
    if (item.req === "admin") return isAdmin;
    return true;
  });

  const filteredBottomNav = bottomNav.filter((item) => {
    if (item.req === "management") return isManagement;
    if (item.req === "admin") return isAdmin;
    return true;
  });

  const renderNavContent = () => (
    <div className="flex h-full flex-col bg-[#0D1117] text-[#C9D1D9]">
      {/* User Header */}
      <div className="flex flex-col px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full overflow-hidden border border-[#30363D] bg-[#161B22]">
            {session?.user?.image ? (
              <img src={session.user.image} alt="User avatar" className="h-full w-full object-cover" />
            ) : (
              <Image src="/logo.jpg" alt="Logo" width={40} height={40} className="object-cover" />
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="hidden shrink-0 rounded-md p-1.5 text-[#8B949E] hover:bg-[#21262D] hover:text-[#C9D1D9] md:flex transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-[#E6EDF3]">
              {session?.user?.name || "Student Developer"}
            </p>
            <p className="truncate text-[13px] text-[#8B949E]">
              {session?.user?.email || "sdc@example.com"}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#21262D] text-[#E6EDF3]"
                  : "text-[#8B949E] hover:bg-[#21262D]/50 hover:text-[#C9D1D9]"
              )}
            >
              <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#E6EDF3]" : "text-[#8B949E] group-hover:text-[#C9D1D9]")} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              
              {!collapsed && (item.name === "Events" || item.name === "Applications") && (
                <span className="ml-auto inline-flex items-center justify-center rounded-full bg-[#21262D] px-2 py-0.5 text-[10px] font-medium text-[#8B949E]">
                  {item.name === "Events" ? "12" : "54"}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Nav */}
      <div className="border-t border-[#30363D] px-3 py-3 space-y-0.5">
        {filteredBottomNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href} onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-[#21262D] text-[#E6EDF3]" : "text-[#8B949E] hover:bg-[#21262D]/50 hover:text-[#C9D1D9]"
              )}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#8B949E] transition-colors hover:bg-red-500/10 hover:text-red-400">
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed left-4 top-3 z-40 rounded-md bg-[#0D1117] p-2 text-[#8B949E] border border-[#30363D] shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </button>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative z-50 flex w-72 flex-col bg-[#0D1117]">
              {renderNavContent()}
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "hidden h-screen shrink-0 border-r border-[#30363D] bg-[#0D1117] transition-all duration-300 md:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {renderNavContent()}
      </div>
    </>
  );
}
