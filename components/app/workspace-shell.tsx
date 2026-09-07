"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, Ellipsis, House, Search } from "lucide-react";
import { MembershipBadge } from "./membership-badge";
import { useHydrated } from "@/lib/use-hydrated";
import { AppSideNav } from "@/components/astryx/app-sidenav";
import { CommandMenu } from "@/components/app/command-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function WorkspaceShell({ user, children }: {
  user: { name: string; image?: string | null; role: string; emailVerified: boolean };
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hydrated = useHydrated();
  const pathname = usePathname();
  const primary = [
    { href: "/dashboard", label: "Home", icon: House },
    { href: "/events", label: "Events", icon: CalendarDays },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ];
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return <div className="club-workspace">
    <a href="#main-content" className="club-skip-link">Skip to content</a>
    <aside className="club-desktop-nav"><AppSideNav role={user.role} user={user} /></aside>
    <div className="club-workspace-body">
      <header className="club-topbar">
        <Link href="/dashboard" className="club-mobile-brand" aria-label="SDC home">sdc<span>.</span></Link>
        <MembershipBadge role={user.role} />
        <CommandMenu role={user.role} open={searchOpen} onOpenChange={setSearchOpen} />
        <NotificationBell />
      </header>
      <main id="main-content" className="club-main" tabIndex={-1}>
        {!user.emailVerified && <div className="club-verification-notice" role="status"><p><strong>Verify your email to take part.</strong> Confirm your address before registering for events or submitting applications.</p><Link href={`/verify-email?callbackUrl=${encodeURIComponent(pathname)}`} className="club-button club-button-secondary">Verify email</Link></div>}
        {children}
      </main>
    </div>
    <nav className="club-bottom-nav" aria-label="Mobile navigation">
      {primary.slice(0, 2).map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}><Icon size={21} aria-hidden="true" /><span>{label}</span></Link>)}
      <button type="button" disabled={!hydrated} onClick={() => setSearchOpen(true)} aria-label="Search" aria-haspopup="dialog" aria-expanded={searchOpen}><Search size={21} aria-hidden="true" /><span>Search</span></button>
      <Link href="/notifications" aria-current={active("/notifications") ? "page" : undefined}><Bell size={21} aria-hidden="true" /><span>Notifications</span></Link>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetTrigger asChild><button type="button" disabled={!hydrated} aria-label="Open navigation" data-current={!primary.some(item => active(item.href)) || undefined}><Ellipsis size={21} aria-hidden="true" /><span>More</span></button></SheetTrigger>
        <SheetContent side="left" className="club-mobile-sheet">
          <SheetTitle className="sr-only">Club navigation</SheetTitle>
          <SheetDescription className="sr-only">Your club, community, and account pages.</SheetDescription>
          <AppSideNav role={user.role} user={user} onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </nav>
  </div>;
}
