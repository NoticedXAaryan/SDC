"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { getNavigation } from "@/lib/config/nav";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";

export function CommandMenu({ role = "outsider" }: { role?: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(value => !value);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
  return <>
    <button type="button" className="club-search" onClick={() => setOpen(true)} aria-label="Find a page" aria-keyshortcuts="Control+k Meta+k">
      <Search size={17} aria-hidden="true" /><span>Find a page</span><kbd aria-hidden="true">Ctrl K</kbd>
    </button>
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Find a page</DialogTitle>
      <DialogDescription className="sr-only">Search the pages available to your account. Use the arrow keys to choose a result.</DialogDescription>
      <CommandInput placeholder="Search pages…" aria-label="Search pages" />
      <CommandList>
        <CommandEmpty>No matching pages. Try “events” or “profile”.</CommandEmpty>
        {getNavigation(role).map(group => <CommandGroup key={group.label} heading={group.label}>
          {group.items.map(item => <CommandItem key={item.href} value={item.label + " " + group.label} onSelect={() => { setOpen(false); router.push(item.href); }}>
            <ArrowRight size={16} aria-hidden="true" /><span>{item.label}</span>
          </CommandItem>)}
        </CommandGroup>)}
      </CommandList>
    </CommandDialog>
  </>;
}
