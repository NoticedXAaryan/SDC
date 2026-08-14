import { TableSkeleton, PageHeaderSkeleton } from "@/components/app/loading-skeletons";

export default function ApplicationsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading applications…">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} cols={6} />
      <span className="sr-only">Loading applications, please wait…</span>
    </div>
  );
}
