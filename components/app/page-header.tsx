import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  icon?: React.ElementType
  status?: React.ReactNode
  primaryAction?: React.ReactNode
  secondaryActions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  status,
  primaryAction,
  secondaryActions,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 mb-8", className)} {...props}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-6 w-6 text-muted-foreground" />}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {status && <div className="ml-2">{status}</div>}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            {secondaryActions}
            {primaryAction && (
              <div className="w-full md:w-auto [&>*]:w-full md:[&>*]:w-auto">
                {primaryAction}
              </div>
            )}
          </div>
        )}
      </div>
      
      {children && (
        <div className="flex items-center gap-2 pt-2">
          {children}
        </div>
      )}
    </div>
  )
}
