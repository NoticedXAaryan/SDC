/**
 * SOC Error Boundary Components
 * Shared across all dashboard routes.
 * Doc ref: §03 step 11, §09 — provide error states in every template.
 */
"use client";

import React from "react";
import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home, ShieldOff, WifiOff, Search } from "lucide-react";

interface ErrorDisplayProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Defaults to "generic" */
  type?: "generic" | "not-found" | "forbidden" | "network";
}

const config = {
  generic: {
    icon: AlertTriangle,
    color: "text-[var(--color-warning)]",
    bgColor: "bg-[rgba(245,158,11,0.1)]",
    title: "Something went wrong",
    description: "An unexpected error occurred. Our team has been notified. You can try again or return to the dashboard.",
  },
  "not-found": {
    icon: Search,
    color: "text-[var(--soc-accretion-violet)]",
    bgColor: "bg-[rgba(124,58,237,0.1)]",
    title: "Not found",
    description: "The page or resource you're looking for doesn't exist or has been moved.",
  },
  forbidden: {
    icon: ShieldOff,
    color: "text-[var(--color-danger)]",
    bgColor: "bg-[rgba(239,68,68,0.1)]",
    title: "Access denied",
    description: "You don't have permission to view this page. Contact your club administrator if you believe this is an error.",
  },
  network: {
    icon: WifiOff,
    color: "text-[var(--color-info)]",
    bgColor: "bg-[rgba(59,130,246,0.1)]",
    title: "Connection lost",
    description: "Unable to reach the server. Please check your connection and try again.",
  },
};

/** Inline error state — used within page Suspense boundaries */
export function InlineError({
  error,
  reset,
  type = "generic",
}: ErrorDisplayProps) {
  const { icon: Icon, color, bgColor, title, description } = config[type];

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("[SOC Error]", error);
    }
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center gap-6 py-16 text-center"
    >
      {/* Illustration */}
      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${bgColor}`}>
        <Icon aria-hidden="true" size={28} className={color} />
      </div>

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h2 className="text-lg font-semibold text-[var(--color-fg)]">{title}</h2>
        <p className="text-sm text-[var(--color-fg-dim)]">{description}</p>
        {error?.digest && (
          <p className="mt-1 font-mono text-xs text-[var(--color-fg-dim)] opacity-60">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {type !== "forbidden" && type !== "not-found" && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--d-panel)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] ring-1 ring-[var(--d-line)] transition-colors hover:bg-[var(--d-panel-alt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Try again
          </button>
        )}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
        >
          <Home aria-hidden="true" size={16} />
          Dashboard
        </Link>
      </div>
    </div>
  );
}

/** Full-page error boundary for Next.js error.tsx */
export default function PageErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <InlineError error={error} reset={reset} />
    </div>
  );
}

/** Forbidden / unauthorized state (no error.tsx needed — render inline) */
export function ForbiddenState({ resource = "this page" }: { resource?: string }) {
  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-6 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(239,68,68,0.1)]">
        <ShieldOff aria-hidden="true" size={28} className="text-[var(--color-danger)]" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h2 className="text-lg font-semibold text-[var(--color-fg)]">Access denied</h2>
        <p className="text-sm text-[var(--color-fg-dim)]">
          You don't have permission to access {resource}. If you believe this is an error,
          contact your club administrator.
        </p>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--d-panel)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] ring-1 ring-[var(--d-line)] transition-colors hover:bg-[var(--d-panel-alt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
      >
        <Home aria-hidden="true" size={16} />
        Return to dashboard
      </Link>
    </div>
  );
}

/** Not-found inline state */
export function NotFoundState({
  title = "Not found",
  description = "This resource doesn't exist or has been removed.",
  backHref = "/dashboard",
  backLabel = "Go back",
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-6 py-16 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[rgba(124,58,237,0.1)]">
        <Search aria-hidden="true" size={28} className="text-[var(--soc-accretion-violet)]" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-sm">
        <h2 className="text-lg font-semibold text-[var(--color-fg)]">{title}</h2>
        <p className="text-sm text-[var(--color-fg-dim)]">{description}</p>
      </div>

      <Link
        href={backHref}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--d-panel)] px-4 py-2.5 text-sm font-medium text-[var(--color-fg)] ring-1 ring-[var(--d-line)] transition-colors hover:bg-[var(--d-panel-alt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)] min-h-[var(--touch-target)] min-w-[var(--touch-target)]"
      >
        {backLabel}
      </Link>
    </div>
  );
}
