import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/app/loading-skeletons";

export default function EventsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading events…">
      <PageHeaderSkeleton />
      {/* Filter bar skeleton */}
      <div className="flex gap-2" aria-hidden="true">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-8 w-24 rounded-full bg-[var(--d-panel-alt)] animate-pulse" style={{animationDelay: `${i*60}ms`}} />
        ))}
      </div>
      <CardGridSkeleton count={6} cols={3} />
      <span className="sr-only">Loading events, please wait…</span>
    </div>
  );
}
