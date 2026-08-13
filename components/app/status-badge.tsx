import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Info,
} from "lucide-react"

export type StatusVariant = 
  | "neutral" // draft/archived/inactive
  | "info" // scheduled/published/in progress
  | "success" // confirmed/issued/delivered/completed
  | "warning" // pending/waitlist/action required/retry
  | "destructive" // cancelled/revoked/failed/rejected

interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant: StatusVariant
  label: string
  showIcon?: boolean
}

const variantStyles: Record<StatusVariant, string> = {
  neutral: "bg-muted text-muted-foreground hover:bg-muted",
  info: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-300",
  success: "bg-green-100 text-green-800 hover:bg-green-100/80 dark:bg-green-900/30 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-300",
  destructive: "bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-300",
}

const variantIcons: Record<StatusVariant, React.ElementType> = {
  neutral: Clock,
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  destructive: XCircle,
}

export function StatusBadge({
  variant,
  label,
  showIcon = true,
  className,
  ...props
}: StatusBadgeProps) {
  const Icon = variantIcons[variant]
  
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium border-transparent", variantStyles[variant], className)}
      {...props}
    >
      {showIcon && <Icon className="mr-1 h-3 w-3" aria-hidden="true" />}
      {label}
    </Badge>
  )
}
