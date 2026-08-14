/**
 * PageHeader — cosmic observatory page heading.
 * Implements doc §02 step 6: stable page structure:
 * breadcrumb, task-oriented title, short purpose, primary action, secondary actions.
 *
 * Shadcn exception note: None — uses Astryx Heading/Text + SOC tokens.
 */
import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** Optional eyebrow label above title (e.g. "Events > Hackathon 2026") */
  eyebrow?: string;
  /** Status badge next to title */
  statusBadge?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  primaryAction,
  secondaryAction,
  eyebrow,
  statusBadge,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-8">
      {/* Left: title group */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--soc-accretion-violet)]">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-fg)] leading-tight">
            {title}
          </h1>
          {statusBadge}
        </div>
        {description && (
          <p className="text-sm text-[var(--color-fg-dim)] max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {/* Right: actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-2 shrink-0 mt-3 sm:mt-0 flex-wrap sm:flex-nowrap">
          {secondaryAction}
          {primaryAction}
        </div>
      )}
    </div>
  );
}

/**
 * SectionHeader — lighter heading for content sections within a page.
 * Uses Astryx Text token and cosmic lensing accent.
 */
export function SectionHeader({
  title,
  action,
  className = "",
  id,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`}>
      <h2 id={id} className="text-base font-semibold text-[var(--color-fg)]">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
