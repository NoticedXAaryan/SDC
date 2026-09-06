"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { signOut } from "@/lib/auth-client";
import { getNavigation, isActiveDestination } from "@/lib/config/nav";

interface AppSideNavProps {
  role?: string;
  user?: { name: string; image?: string | null; role?: string };
  onNavigate?: () => void;
}
export function AppSideNav({ role = "outsider", user, onNavigate }: AppSideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  async function handleSignOut() {
    setSigningOut(true);
    setError("");
    try {
      const result = await signOut();
      if (result.error) throw new Error("Sign out failed");
      router.replace("/login");
      router.refresh();
    } catch {
      setError("Could not sign out. Try again.");
      setSigningOut(false);
    }
  }
  return (
    <div className="club-nav">
      <Link href="/dashboard" onClick={onNavigate} className="club-brand" aria-label="SDC home">
        <span className="club-monogram" aria-hidden="true">sdc<span>.</span></span>
        <span>Student Developer Club<small>Parul University</small></span>
      </Link>
      <nav aria-label="Club navigation" className="club-nav-groups">
        {getNavigation(role).map(group => {
          const links = group.items.map(item => (
            <Link key={item.href} href={item.href} onClick={onNavigate}
              aria-current={isActiveDestination(pathname, item.href) ? "page" : undefined}
              className="club-nav-link">{item.label}</Link>
          ));
          return group.secondary ? (
            <details key={group.label + pathname} open={group.items.some(item => isActiveDestination(pathname, item.href))} className="club-nav-group">
              <summary>{group.label}<ChevronDown size={14} aria-hidden="true" /></summary>
              <div className="club-nav-links">{links}</div>
            </details>
          ) : (
            <div key={group.label} className="club-nav-group">
              <p className="club-nav-label">{group.label}</p>
              <div className="club-nav-links">{links}</div>
            </div>
          );
        })}
      </nav>
      <div className="club-nav-footer">
        <Link href="/" className="club-nav-link" onClick={onNavigate}>Club website<ArrowUpRight size={15} aria-hidden="true" /></Link>
        <Link href="/settings" onClick={onNavigate} className="club-profile">
          <span className="club-avatar" aria-hidden="true">{(user?.name || "S").slice(0, 1).toUpperCase()}</span>
          <span>{user?.name || "Your account"}<small>Profile & settings</small></span>
        </Link>
        <div className="club-nav-utilities">
          <button type="button" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")} aria-label="Toggle color theme">
            <Moon size={16} className="hidden dark:block" aria-hidden="true" /><Sun size={16} className="dark:hidden" aria-hidden="true" />Theme
          </button>
          <button type="button" onClick={handleSignOut} disabled={signingOut}><LogOut size={16} aria-hidden="true" />{signingOut ? "Signing out…" : "Sign out"}</button>
        </div>
        {error && <p role="alert" className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
