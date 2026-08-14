import { TableSkeleton, PageHeaderSkeleton, MetricsSkeleton } from "@/components/app/loading-skeletons";

export default function InventoryLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading inventory…">
      <PageHeaderSkeleton />
      <MetricsSkeleton count={3} />
      <TableSkeleton rows={10} cols={6} />
      <span className="sr-only">Loading inventory, please wait…</span>
    </div>
  );
}
