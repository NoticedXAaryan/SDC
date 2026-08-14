/**
 * Shared loading skeleton components for different page patterns.
 * Used by route-level loading.tsx files.
 * Doc ref: §09 step 14 — predictable skeletons rather than layout-shifting spinners.
 */

/** Generic page header skeleton */
export function PageHeaderSkeleton({
  hasAction = true,
}: {
  hasAction?: boolean;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-40 rounded-lg bg-[var(--d-panel-alt)] animate-pulse" />
        <div className="h-4 w-64 rounded-md bg-[var(--d-panel-alt)] opacity-60 animate-pulse delay-100" />
      </div>
      {hasAction && (
        <div className="h-9 w-28 rounded-lg bg-[var(--d-panel-alt)] animate-pulse delay-150" />
      )}
    </div>
  );
}

/** Grid of card skeletons */
export function CardGridSkeleton({
  count = 6,
  cols = 3,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
}) {
  const colClass = { 2: "md:grid-cols-2", 3: "md:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[cols];
  return (
    <div className={`grid grid-cols-1 ${colClass} gap-6`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="cosmic-panel overflow-hidden flex flex-col"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-48 w-full bg-[var(--d-panel-alt)] animate-pulse" />
          <div className="p-6 flex flex-col gap-3 flex-1">
            <div className="flex justify-between items-center">
              <div className="h-5 w-20 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
              <div className="h-4 w-24 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
            </div>
            <div className="h-5 w-3/4 rounded-md bg-[var(--d-panel-alt)] animate-pulse" />
            <div className="h-4 w-full rounded-md bg-[var(--d-panel-alt)] animate-pulse opacity-60" />
            <div className="h-4 w-2/3 rounded-md bg-[var(--d-panel-alt)] animate-pulse opacity-40" />
          </div>
          <div className="p-6 pt-0 mt-auto">
            <div className="h-9 w-full rounded-lg bg-[var(--d-panel-alt)] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table skeleton */
export function TableSkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="cosmic-panel overflow-hidden" aria-hidden="true">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-3 border-b border-[var(--d-line)] bg-[var(--d-panel-alt)]">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 rounded-full bg-[var(--d-line)] animate-pulse flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-6 py-4 border-b border-[var(--d-line)] last:border-0"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className={`h-4 rounded-full bg-[var(--d-panel-alt)] animate-pulse flex-1 ${j === 0 ? "max-w-[120px]" : ""}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Metric cards skeleton row */
export function MetricsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${count === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-4`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="orbital-metric"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="h-3 w-20 rounded-full bg-[var(--d-line)] animate-pulse" />
            <div className="h-7 w-7 rounded-md bg-[var(--d-line)] animate-pulse" />
          </div>
          <div className="h-7 w-14 rounded-md bg-[var(--d-line)] animate-pulse mt-2" />
        </div>
      ))}
    </div>
  );
}

/** Single detail workspace skeleton */
export function DetailWorkspaceSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl" aria-hidden="true">
      <PageHeaderSkeleton />
      {/* Status bar */}
      <div className="flex items-center gap-3">
        <div className="h-6 w-24 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
        <div className="h-6 w-32 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
      </div>
      {/* Main content */}
      <div className="cosmic-panel p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-24 shrink-0 rounded-full bg-[var(--d-panel-alt)] animate-pulse" />
            <div className="h-4 flex-1 rounded-full bg-[var(--d-panel-alt)] animate-pulse opacity-70" />
          </div>
        ))}
      </div>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--d-line)] pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-t-md bg-[var(--d-panel-alt)] animate-pulse" />
        ))}
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
