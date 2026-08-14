import { Spinner, Center } from "@astryxdesign/core";

export default function DashboardLoading() {
  return (
    <Center minHeight="60vh">
      <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in duration-300">
        <Spinner size="lg" aria-label="Loading dashboard content..." />
        <p className="text-sm font-medium tracking-tight">Loading...</p>
      </div>
    </Center>
  );
}
