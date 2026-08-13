"use client";

import { Search, Bell } from "lucide-react";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function AppTopNav() {
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const event = new KeyboardEvent("keydown", { metaKey: true, key: "k" });
    document.dispatchEvent(event);
  };

  return (
    <div className="w-full flex items-center justify-between px-6 py-4 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-20">
      {/* Search Bar - matching Image 5 top nav */}
      <div className="flex-1 max-w-xl">
        <button 
          onClick={handleSearchClick}
          className="flex items-center justify-between w-full max-w-md px-3 py-2 rounded-lg border border-border bg-muted/30 text-muted-foreground text-sm hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <NotificationBell />
      </div>
    </div>
  );
}
