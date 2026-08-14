import { MetricsSkeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/app/loading-skeletons";

export default function FinanceLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading finance…">
      <PageHeaderSkeleton />
      <MetricsSkeleton count={4} />
      <TableSkeleton rows={10} cols={6} />
      <span className="sr-only">Loading finance data, please wait…</span>
    </div>
  );
}
