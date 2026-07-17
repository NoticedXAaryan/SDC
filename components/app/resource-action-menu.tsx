"use client"

import * as React from "react"
import { MoreHorizontal } from "lucide-react"

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
  onClick: () => void
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
  const hasMultipleSections = 
    (actions.primary?.length ?? 0) > 0 && 
    (actions.management?.length ?? 0) > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.primary?.map((action, i) => (
          <DropdownMenuItem key={i} onClick={action.onClick} className="gap-2">
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}

        {hasMultipleSections && <DropdownMenuSeparator />}

        {actions.management?.map((action, i) => (
          <DropdownMenuItem key={i} onClick={action.onClick} className="gap-2">
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}

        {(actions.destructive?.length ?? 0) > 0 && <DropdownMenuSeparator />}

        {actions.destructive?.map((action, i) => (
          <DropdownMenuItem 
            key={i} 
            onClick={action.onClick}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive gap-2"
          >
            {action.icon && <action.icon className="h-4 w-4" />}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
