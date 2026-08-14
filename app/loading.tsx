import { Spinner } from "@astryxdesign/core";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in zoom-in duration-300">
        <Spinner size="lg" aria-label="Loading content..." />
        <p className="text-sm font-medium tracking-tight">Initializing...</p>
      </div>
    </div>
  );
}
