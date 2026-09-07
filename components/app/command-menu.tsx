"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { getNavigation } from "@/lib/config/nav";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useHydrated } from "@/lib/use-hydrated";

export function CommandMenu({ role = "outsider", open, onOpenChange }: { role?: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const hydrated = useHydrated();
  const router = useRouter();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);
  return <>
    <button type="button" disabled={!hydrated} className="club-search club-desktop-search" onClick={() => onOpenChange(true)} aria-label="Find a page" aria-keyshortcuts="Control+k Meta+k">
      <Search size={17} aria-hidden="true" /><span>Find a page</span><kbd aria-hidden="true">Ctrl K</kbd>
    </button>
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="club-command-title">Where would you like to go?</DialogTitle>
      <DialogDescription className="sr-only">Search the pages available to your account. Use the arrow keys to choose a result.</DialogDescription>
      <CommandInput placeholder="Search pages…" aria-label="Search pages" />
      <CommandList>
        <CommandEmpty>No matching pages. Try “events” or “profile”.</CommandEmpty>
        {getNavigation(role).map(group => <CommandGroup key={group.label} heading={group.label}>
            {group.items.map(item => <CommandItem key={item.href} value={item.label + " " + group.label} onSelect={() => { onOpenChange(false); router.push(item.href); }}>
            <ArrowRight size={16} aria-hidden="true" /><span>{item.label}</span>
          </CommandItem>)}
        </CommandGroup>)}
      </CommandList>
    </CommandDialog>
  </>;
}
