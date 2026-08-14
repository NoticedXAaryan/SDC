import { TableSkeleton, PageHeaderSkeleton } from "@/components/app/loading-skeletons";

export default function CertificatesLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading certificates…">
      <PageHeaderSkeleton />
      <TableSkeleton rows={8} cols={5} />
      <span className="sr-only">Loading certificates, please wait…</span>
    </div>
  );
}
