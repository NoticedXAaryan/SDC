/**
 * SOC Route Loading State — Dashboard workspace loading skeleton
 * Used by Next.js loading.tsx convention as Suspense boundary fallback.
 * Shows role-aware skeleton structure, no layout shift.
 */
import { BlackHoleLoader } from "@/components/design-system";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard…">
      {/* Page header skeleton */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 rounded-lg bg-[var(--d-panel-alt)]" />
          <div className="h-4 w-72 rounded-md bg-[var(--d-panel-alt)] opacity-60" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-[var(--d-panel-alt)]" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="cosmic-panel p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded-full bg-[var(--d-panel-alt)]" />
              <div className="h-7 w-7 rounded-md bg-[var(--d-panel-alt)]" />
            </div>
            <div className="h-7 w-16 rounded-md bg-[var(--d-panel-alt)]" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="cosmic-panel p-6 flex flex-col gap-4" style={{ minHeight: 240 }}>
            <div className="h-5 w-32 rounded-md bg-[var(--d-panel-alt)]" />
            <div className="flex flex-col gap-2 flex-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 rounded-full bg-[var(--d-panel-alt)] shrink-0" />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="h-3 w-3/4 rounded-full bg-[var(--d-panel-alt)]" />
                    <div className="h-3 w-1/2 rounded-full bg-[var(--d-panel-alt)] opacity-60" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading dashboard, please wait…</span>
    </div>
  );
}
