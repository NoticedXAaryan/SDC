"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { AppSideNav } from "@/components/astryx/app-sidenav";
import { CommandMenu } from "@/components/app/command-menu";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function WorkspaceShell({ user, children }: {
  user: { name: string; image?: string | null; role: string; emailVerified: boolean };
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="club-workspace">
      <a href="#main-content" className="club-skip-link">Skip to content</a>
      <aside className="club-desktop-nav"><AppSideNav role={user.role} user={user} /></aside>
      <div className="club-workspace-body">
        <header className="club-topbar">
          <div className="club-mobile-menu">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild><button type="button" className="club-icon-button" aria-label="Open navigation"><Menu size={22} aria-hidden="true" /></button></SheetTrigger>
              <SheetContent side="left" className="club-mobile-sheet">
                <SheetTitle className="sr-only">Club navigation</SheetTitle>
                <SheetDescription className="sr-only">Your club, community, and account pages.</SheetDescription>
                <AppSideNav role={user.role} user={user} onNavigate={() => setMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <CommandMenu role={user.role} />
          <NotificationBell />
        </header>
        <main id="main-content" className="club-main" tabIndex={-1}>
          {!user.emailVerified && <div className="club-verification-notice" role="status"><p><strong>Verify your email to take part.</strong> Confirm your address before registering for events or submitting applications.</p><Link href={`/verify-email?callbackUrl=${encodeURIComponent(pathname)}`} className="club-button club-button-secondary">Verify email</Link></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
