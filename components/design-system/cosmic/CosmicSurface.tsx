/**
 * LensingDivider — chromatic chromatic separator with gravitational lensing effect.
 * CosmicSurface — a reusable surface panel with depth and texture.
 * Doc ref: §04 visual rules, §03 SOC design system layer.
 */
import React from "react";

/** Chromatic horizontal divider */
export function LensingDivider({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      role="separator"
      className={`lensing-divider ${className}`}
    />
  );
}

interface CosmicSurfaceProps {
  children: React.ReactNode;
  /** "default" = cosmic-panel, "raised" = elevated shadow, "transparent" = glass */
  variant?: "default" | "raised" | "transparent" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function CosmicSurface({
  children,
  variant = "default",
  padding = "md",
  className = "",
  as: Tag = "div",
}: CosmicSurfaceProps) {
  const variantClass = {
    default:     "cosmic-panel",
    raised:      "cosmic-panel-raised",
    transparent: "bg-transparent border border-[var(--d-line)] rounded-[var(--radius-tile)]",
    glass:       "glass-panel rounded-[var(--radius-tile)]",
  }[variant];

  return (
    <Tag className={`${variantClass} ${paddingMap[padding]} ${className}`}>
      {children}
    </Tag>
  );
}

/** SOC section heading with optional brand accent rule */
interface CosmicSectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  accent?: boolean;
}

export function CosmicSectionHeading({
  eyebrow,
  title,
  description,
  accent = false,
}: CosmicSectionHeadingProps) {
  return (
    <div className="flex flex-col gap-2">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--soc-accretion-violet)]">
          {eyebrow}
        </p>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-[var(--color-fg)]">
        {title}
      </h2>
      {accent && <LensingDivider className="mt-2" />}
      {description && (
        <p className="text-sm text-[var(--color-fg-dim)] mt-1">{description}</p>
      )}
    </div>
  );
}

/**
 * EmptyCosmicState — themed empty state with optional black hole illustration.
 * Used when data is absent. Never leave a blank content region.
 * Doc ref: §03 step 11 — provide empty state in every template.
 */
interface EmptyCosmicStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** "void" = black hole SVG, "orbit" = orbit ring, "search" = search icon */
  illustration?: "void" | "orbit" | "search" | "none";
  size?: "sm" | "md" | "lg";
}

const IllustrationVoid = () => (
  <svg
    aria-hidden="true"
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-60"
  >
    {/* Outer accretion ring */}
    <circle cx="40" cy="40" r="36" stroke="rgba(168,85,247,0.25)" strokeWidth="1.5" strokeDasharray="3 5" />
    <circle cx="40" cy="40" r="26" stroke="rgba(168,85,247,0.15)" strokeWidth="1" />
    {/* Core */}
    <radialGradient id="ec-core" cx="40%" cy="35%">
      <stop offset="0%" stopColor="#1a0a3d" />
      <stop offset="100%" stopColor="#02010a" />
    </radialGradient>
    <circle cx="40" cy="40" r="14" fill="url(#ec-core)" />
    {/* Lensing shimmer */}
    <circle cx="40" cy="40" r="16" stroke="rgba(168,85,247,0.2)" strokeWidth="1.5" />
    {/* Starfield dots */}
    {[
      [10, 12], [68, 8], [72, 62], [12, 68], [55, 20], [25, 58],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r="1.5" fill="rgba(240,238,251,0.5)" />
    ))}
  </svg>
);

const IllustrationOrbit = () => (
  <svg
    aria-hidden="true"
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-50"
  >
    <ellipse cx="40" cy="40" rx="35" ry="14" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" />
    <ellipse cx="40" cy="40" rx="22" ry="8" stroke="rgba(124,58,237,0.2)" strokeWidth="1" />
    <circle cx="40" cy="40" r="6" fill="rgba(124,58,237,0.4)" />
    <circle cx="76" cy="40" r="4" fill="rgba(168,85,247,0.6)" />
  </svg>
);

const IllustrationSearch = () => (
  <svg
    aria-hidden="true"
    width="80"
    height="80"
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="opacity-50"
  >
    <circle cx="36" cy="36" r="22" stroke="rgba(124,58,237,0.4)" strokeWidth="2" />
    <line x1="52" y1="52" x2="68" y2="68" stroke="rgba(124,58,237,0.4)" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="36" cy="36" r="14" stroke="rgba(124,58,237,0.2)" strokeWidth="1" strokeDasharray="3 3" />
  </svg>
);

export function EmptyCosmicState({
  title,
  description,
  action,
  illustration = "void",
  size = "md",
}: EmptyCosmicStateProps) {
  const sizeClass = {
    sm: "py-8",
    md: "py-16",
    lg: "py-24",
  }[size];

  const Illus =
    illustration === "void"   ? IllustrationVoid :
    illustration === "orbit"  ? IllustrationOrbit :
    illustration === "search" ? IllustrationSearch : null;

  return (
    <div className={`flex flex-col items-center justify-center text-center gap-4 ${sizeClass}`}>
      {Illus && <Illus />}
      <div className="flex flex-col gap-1.5 max-w-sm">
        <p className="text-base font-semibold text-[var(--color-fg)]">{title}</p>
        {description && (
          <p className="text-sm text-[var(--color-fg-dim)]">{description}</p>
        )}
      </div>
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
