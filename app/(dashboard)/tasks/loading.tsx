import { CardGridSkeleton, PageHeaderSkeleton } from "@/components/app/loading-skeletons";

export default function TasksLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading tasks…">
      <PageHeaderSkeleton />
      <CardGridSkeleton count={6} cols={3} />
      <span className="sr-only">Loading tasks, please wait…</span>
    </div>
  );
}
