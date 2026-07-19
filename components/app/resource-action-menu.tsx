"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

export interface ActionMenuItem {
  label: string
  icon?: React.ElementType
  onClick?: () => void
  href?: string
  destructive?: boolean
}

interface ResourceActionMenuProps {
  label?: string
  actions: {
    primary?: ActionMenuItem[]
    management?: ActionMenuItem[]
    destructive?: ActionMenuItem[]
  }
}

export function ResourceActionMenu({ label = "Actions", actions }: ResourceActionMenuProps) {
  const router = useRouter()

  const hasMultipleSections = 
    (actions.primary?.length ?? 0) > 0 && 
    (actions.management?.length ?? 0) > 0

  const renderItem = (action: ActionMenuItem, i: number, isDestructive = false) => {
    const content = (
      <>
        {action.icon && <action.icon className="h-4 w-4" />}
        {action.label}
      </>
    )

    const className = isDestructive 
      ? "text-destructive focus:bg-destructive/10 focus:text-destructive gap-2 cursor-pointer" 
      : "gap-2 cursor-pointer"

    if (action.href) {
      return (
        <DropdownMenuItem key={i} className={className} onClick={() => router.push(action.href as string)}>
          {content}
        </DropdownMenuItem>
      )
    }

    return (
      <DropdownMenuItem key={i} onClick={action.onClick} className={className}>
        {content}
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.primary?.map((action, i) => renderItem(action, i))}
        {hasMultipleSections && <DropdownMenuSeparator />}
        {actions.management?.map((action, i) => renderItem(action, i))}
        {(actions.destructive?.length ?? 0) > 0 && <DropdownMenuSeparator />}
        {actions.destructive?.map((action, i) => renderItem(action, i, true))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

