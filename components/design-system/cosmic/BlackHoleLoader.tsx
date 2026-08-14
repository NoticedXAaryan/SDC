/**
 * BlackHoleLoader — animated loading state for high-attention brand moments.
 * Static fallback via aria-label and aria-busy.
 * Doc ref: §04 — build as layered SVG/CSS, must have static fallback.
 */
"use client";

import React from "react";

interface BlackHoleLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const sizes = {
  sm: { outer: 40, inner: 12, ring1: 32, ring2: 18 },
  md: { outer: 72, inner: 20, ring1: 58, ring2: 32 },
  lg: { outer: 120, inner: 32, ring1: 96, ring2: 52 },
};

export function BlackHoleLoader({
  size = "md",
  label = "Loading…",
  className = "",
}: BlackHoleLoaderProps) {
  const { outer, inner, ring1, ring2 } = sizes[size];
  const cx = outer / 2;

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <svg
        width={outer}
        height={outer}
        viewBox={`0 0 ${outer} ${outer}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Accretion disk — outer slow ring */}
        <circle
          cx={cx}
          cy={cx}
          r={ring1 / 2}
          stroke="url(#grad-outer)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          className="animate-orbit-slow"
          style={{ transformOrigin: `${cx}px ${cx}px` }}
        />

        {/* Inner ring — faster, reverse */}
        <circle
          cx={cx}
          cy={cx}
          r={ring2 / 2}
          stroke="url(#grad-inner)"
          strokeWidth="1.5"
          className="animate-orbit-slow-reverse"
          style={{ transformOrigin: `${cx}px ${cx}px` }}
        />

        {/* Black hole core */}
        <circle
          cx={cx}
          cy={cx}
          r={inner / 2}
          fill="url(#grad-core)"
        />

        {/* Lensing shimmer */}
        <circle
          cx={cx}
          cy={cx}
          r={inner / 2 + 2}
          stroke="rgba(168,85,247,0.3)"
          strokeWidth="2"
          className="animate-neon-pulse"
        />

        <defs>
          <radialGradient id="grad-core" cx="40%" cy="35%">
            <stop offset="0%" stopColor="#1a0a3d" />
            <stop offset="100%" stopColor="#02010a" />
          </radialGradient>
          <linearGradient id="grad-outer" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#b3f23c" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="grad-inner" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Inline skeleton shimmer for table/list placeholders */
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-md bg-[var(--d-panel-alt)] relative overflow-hidden ${className}`}
    >
      <div
        className="absolute inset-0 -translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
          animation: "shimmer 1.6s ease-in-out infinite",
        }}
      />
    </div>
  );
}

/** Full-page loading overlay with black hole */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[var(--soc-well,#04020a)]"
    >
      <BlackHoleLoader size="lg" />
      <p className="text-sm text-[var(--color-ink-muted)] animate-pulse-dim">{label}</p>
    </div>
  );
}
