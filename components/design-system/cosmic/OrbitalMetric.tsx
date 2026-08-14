/**
 * OrbitalMetric — numeric stat card with SOC brand treatment.
 * Uses cosmic-panel token surface. No raw colors in this component.
 * Doc ref: §03 SOC design system layer, §04 brand tokens.
 */
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface OrbitalMetricProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  /** Optional accent for the glow — "violet" | "lime" | "blue" */
  accent?: "violet" | "lime" | "blue" | "none";
  className?: string;
}

const accentGradients: Record<string, string> = {
  violet: "radial-gradient(circle at 90% 10%, rgba(124,58,237,0.14) 0%, transparent 60%)",
  lime:   "radial-gradient(circle at 90% 10%, rgba(179,242,60,0.10) 0%, transparent 60%)",
  blue:   "radial-gradient(circle at 90% 10%, rgba(59,130,246,0.12) 0%, transparent 60%)",
  none:   "none",
};

const trendConfig = {
  up:      { icon: TrendingUp,   color: "text-[var(--color-positive)]", bg: "bg-[rgba(34,197,94,0.12)]" },
  down:    { icon: TrendingDown,  color: "text-[var(--color-danger)]",   bg: "bg-[rgba(239,68,68,0.12)]" },
  neutral: { icon: Minus,         color: "text-[var(--color-fg-dim)]",   bg: "bg-[rgba(133,133,150,0.12)]" },
};

export function OrbitalMetric({
  title,
  value,
  icon,
  trend,
  trendLabel,
  accent = "violet",
  className = "",
}: OrbitalMetricProps) {
  const TrendIcon = trend ? trendConfig[trend].icon : null;

  return (
    <div
      className={`orbital-metric ${className}`}
      style={{ "--_accent-gradient": accentGradients[accent] } as React.CSSProperties}
    >
      {/* Accent glow overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{ background: accentGradients[accent] }}
      />

      {/* Header row */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-[var(--color-fg-dim)]">
          {title}
        </span>
        {icon && (
          <div
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[rgba(124,58,237,0.12)] text-[var(--soc-accretion-violet)]"
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="relative z-10 mt-2">
        <p className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">
          {value}
        </p>
      </div>

      {/* Trend */}
      {trend && trendLabel && TrendIcon && (
        <div className="relative z-10 mt-1 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trendConfig[trend].color} ${trendConfig[trend].bg}`}
          >
            <TrendIcon aria-hidden="true" size={12} />
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

/** Grid wrapper for a row of OrbitalMetrics */
export function OrbitalMetricGrid({
  children,
  cols = 4,
  className = "",
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  }[cols];

  return (
    <div className={`grid gap-4 ${colClass} ${className}`}>
      {children}
    </div>
  );
}
