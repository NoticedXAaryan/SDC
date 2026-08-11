"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Settings,
  Users,
  QrCode,
  CreditCard,
  Inbox,
  Award,
  MessageSquare,
  Target,
  CheckSquare,
  AlertCircle,
  Plus
} from "lucide-react"

import { CommandPalette, createStaticSource } from "@astryxdesign/core"
import { useSession } from "@/lib/auth-client"

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

  const commands = React.useMemo(() => {
    const items = [
      { id: "my-pass", label: "My QR pass", auxiliaryData: { group: "Personal", icon: <QrCode className="w-4 h-4 mr-2" />, action: () => router.push("/passes/me") } },
      { id: "my-registrations", label: "My registrations", auxiliaryData: { group: "Personal", icon: <CheckSquare className="w-4 h-4 mr-2" />, action: () => router.push("/events/my-registrations") } },
      { id: "submit-feedback", label: "Submit feedback", auxiliaryData: { group: "Personal", icon: <MessageSquare className="w-4 h-4 mr-2" />, action: () => router.push("/forms/feedback") } },
      
      { id: "dashboard", label: "Dashboard", auxiliaryData: { group: "Navigate", icon: <Target className="w-4 h-4 mr-2" />, action: () => router.push("/dashboard") } },
      { id: "events", label: "Events", auxiliaryData: { group: "Navigate", icon: <Calendar className="w-4 h-4 mr-2" />, action: () => router.push("/events") } },
      { id: "certificates", label: "My Certificates", auxiliaryData: { group: "Navigate", icon: <Award className="w-4 h-4 mr-2" />, action: () => router.push("/certificates") } },
    ]

    if (isLead) {
      items.push(
        { id: "manage-comms", label: "Communications", auxiliaryData: { group: "Navigate", icon: <MessageSquare className="w-4 h-4 mr-2" />, action: () => router.push("/manage/communications") } },
        { id: "scanner", label: "Scanner", auxiliaryData: { group: "Navigate", icon: <QrCode className="w-4 h-4 mr-2" />, action: () => router.push("/scanner") } },
        { id: "manage-finance", label: "Finance", auxiliaryData: { group: "Navigate", icon: <CreditCard className="w-4 h-4 mr-2" />, action: () => router.push("/manage/finance") } },
        
        { id: "create-event", label: "Create event", auxiliaryData: { group: "Create", icon: <Plus className="w-4 h-4 mr-2" />, action: () => router.push("/manage/events/new") } },
        { id: "compose-announcement", label: "Compose announcement", auxiliaryData: { group: "Create", icon: <Plus className="w-4 h-4 mr-2" />, action: () => router.push("/manage/communications/new") } },
        { id: "create-form", label: "Create form", auxiliaryData: { group: "Create", icon: <Plus className="w-4 h-4 mr-2" />, action: () => router.push("/manage/forms/new") } },
        
        { id: "pending-approvals", label: "Pending approvals", auxiliaryData: { group: "Current work", icon: <Inbox className="w-4 h-4 mr-2" />, action: () => router.push("/manage/queue") } },
        { id: "registrations-review", label: "Registrations awaiting review", auxiliaryData: { group: "Current work", icon: <AlertCircle className="w-4 h-4 mr-2" />, action: () => router.push("/manage/events/reviews") } }
      )
    }

    if (isAdmin) {
      items.push(
        { id: "admin-members", label: "Members", auxiliaryData: { group: "Navigate", icon: <Users className="w-4 h-4 mr-2" />, action: () => router.push("/admin/members") } },
        { id: "admin-settings", label: "Settings", auxiliaryData: { group: "Navigate", icon: <Settings className="w-4 h-4 mr-2" />, action: () => router.push("/admin/settings") } },
        
        { id: "create-cert-template", label: "Create certificate template", auxiliaryData: { group: "Create", icon: <Plus className="w-4 h-4 mr-2" />, action: () => router.push("/admin/certificates/templates/new") } },
        { id: "add-member", label: "Add member", auxiliaryData: { group: "Create", icon: <Plus className="w-4 h-4 mr-2" />, action: () => router.push("/admin/members/new") } }
      )
    }

    return items
  }, [router, isLead, isAdmin])

  const searchSource = React.useMemo(() => createStaticSource(commands), [commands])

  return (
    <CommandPalette
      isOpen={open}
      onOpenChange={setOpen}
      searchSource={searchSource}
      onValueChange={(id) => {
        const command = commands.find(c => c.id === id)
        if (command && typeof command.auxiliaryData?.action === "function") {
          runCommand(command.auxiliaryData.action as any)
        }
      }}
      renderItem={(item, isSelected) => (
        <div className="flex items-center">
          {item.auxiliaryData?.icon as React.ReactNode}
          <span>{item.label}</span>
        </div>
      )}
    />
  )
}
