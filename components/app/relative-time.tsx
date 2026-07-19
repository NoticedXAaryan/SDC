"use client";

import { useEffect, useState } from "react";

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  // Future dates
  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs);
    const absDiffMin = Math.floor(absDiffMs / 60000);
    const absDiffHr = Math.floor(absDiffMin / 60);
    const absDiffDays = Math.floor(absDiffHr / 24);

    if (absDiffMin < 60) return `in ${absDiffMin}m`;
    if (absDiffHr < 24) return `in ${absDiffHr}h`;
    if (absDiffDays < 7) return `in ${absDiffDays}d`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  // Past dates
  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Client component that renders dates in the user's local timezone.
 * On the server it renders the ISO string to avoid hydration mismatches,
 * then updates to the local format on mount.
 */
export function RelativeTime({ 
  date, 
  format = "relative",
  className = "",
}: { 
  date: string | Date; 
  format?: "relative" | "datetime" | "date" | "time";
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const d = typeof date === "string" ? new Date(date) : date;

  if (!mounted) {
    // Server/SSR: render the ISO date to avoid hydration mismatch
    return <time dateTime={d.toISOString()} className={className}>{d.toISOString().split("T")[0]}</time>;
  }

  let display: string;
  switch (format) {
    case "relative":
      display = formatRelative(d);
      break;
    case "datetime":
      display = d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      break;
    case "date":
      display = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      break;
    case "time":
      display = d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
      break;
  }

  return (
    <time dateTime={d.toISOString()} title={d.toLocaleString()} className={className}>
      {display}
    </time>
  );
}
