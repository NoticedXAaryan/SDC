/**
 * AppTopNav — cosmic-themed top navigation bar.
 * Uses SOC design tokens; no hardcoded colors.
 * - Search triggers command palette (⌘K / Ctrl+K)
 * - NotificationBell with live aria-live badge
 * - Sticky, backdrop-blur, 44px minimum height (accessibility)
 * Doc ref: §03, §09 accessibility, §04 space brand.
 */
"use client";

import { Search } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppTopNav() {
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Dispatch keyboard event so CommandMenu can intercept it
    const event = new KeyboardEvent("keydown", {
      metaKey: true,
      key: "k",
      bubbles: true,
      cancelable: true,
    });
    document.dispatchEvent(event);
  };

  return (
    <header
      role="banner"
      aria-label="Application top bar"
      className="w-full flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[var(--d-line)] sticky top-0 bg-[var(--d-panel)]/90 backdrop-blur-md z-20 min-h-[3rem]"
    >
      {/* ── Search trigger ─────────────────────────────────── */}
      <div className="flex-1 max-w-xl">
        <button
          type="button"
          onClick={handleSearchClick}
          aria-label="Open search and command palette (⌘K)"
          aria-keyshortcuts="Meta+k"
          className="
            flex items-center justify-between w-full max-w-sm px-3 py-2
            rounded-lg border border-[var(--d-line)] bg-[var(--d-panel-alt)]/50
            text-[var(--color-fg-dim)] text-sm
            hover:bg-[var(--d-panel-alt)] hover:border-[var(--soc-accretion-violet)]/40
            transition-colors duration-[var(--motion-micro)]
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]
            min-h-[2.75rem]
          "
        >
          <span className="flex items-center gap-2">
            <Search aria-hidden="true" size={15} className="shrink-0" />
            <span>Search…</span>
          </span>
          <kbd
            aria-hidden="true"
            className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-[var(--d-line)] bg-[var(--d-bg)] text-[10px] font-medium text-[var(--color-fg-dim)]"
          >
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* ── Right actions ───────────────────────────────────── */}
      <div className="flex items-center gap-2 ml-4">
        <NotificationBell />
      </div>
    </header>
  );
}
