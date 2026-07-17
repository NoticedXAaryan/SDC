"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Briefcase,
  Package,
  Settings,
  Users,
  FileText,
  QrCode,
  CreditCard,
  Inbox,
  ShieldCheck,
  Award,
  MessageSquare,
  Target,
  CheckSquare,
  LogOut,
  AlertCircle,
  Plus
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export function CommandMenu() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  const role = (session?.user?.role as string) || "member"
  const isAdmin = ["admin", "faculty_coordinator", "owner"].includes(role)
  const isLead = isAdmin || ["lead", "co_lead", "event_lead", "content_lead", "marketing_lead", "tech_lead", "finance_lead", "volunteer_lead", "vice_lead"].includes(role)

  return (
    <>
      <Button 
        variant="outline" 
        className="w-full max-w-sm justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search (Cmd+K)</span>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

        
        <CommandGroup heading="Personal">
          <CommandItem onSelect={() => runCommand(() => router.push("/passes/me"))}>
            <QrCode />
            <span>My QR pass</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/events/my-registrations"))}>
            <CheckSquare />
            <span>My registrations</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/forms/feedback"))}>
            <MessageSquare />
            <span>Submit feedback</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <Target />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/events"))}>
            <Calendar />
            <span>Events</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/certificates"))}>
            <Award />
            <span>My Certificates</span>
          </CommandItem>
          {isLead && (
            <>
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/communications"))}>
                <MessageSquare />
                <span>Communications</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/scanner"))}>
                <QrCode />
                <span>Scanner</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/finance"))}>
                <CreditCard />
                <span>Finance</span>
              </CommandItem>
            </>
          )}
          {isAdmin && (
            <>
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/members"))}>
                <Users />
                <span>Members</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/admin/settings"))}>
                <Settings />
                <span>Settings</span>
              </CommandItem>
            </>
          )}
        </CommandGroup>

        {isLead && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Create">
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/events/new"))}>
                <Plus />
                <span>Create event</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/communications/new"))}>
                <Plus />
                <span>Compose announcement</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/forms/new"))}>
                <Plus />
                <span>Create form</span>
              </CommandItem>
              {isAdmin && (
                <>
                  <CommandItem onSelect={() => runCommand(() => router.push("/admin/certificates/templates/new"))}>
                    <Plus />
                    <span>Create certificate template</span>
                  </CommandItem>
                  <CommandItem onSelect={() => runCommand(() => router.push("/admin/members/new"))}>
                    <Plus />
                    <span>Add member</span>
                  </CommandItem>
                </>
              )}
            </CommandGroup>
            
            <CommandSeparator />
            <CommandGroup heading="Current work">
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/queue"))}>
                <Inbox />
                <span>Pending approvals</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.push("/manage/events/reviews"))}>
                <AlertCircle />
                <span>Registrations awaiting review</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
    </>
  )
}
