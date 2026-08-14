"use client";

import { useEffect } from "react";
import { Button, EmptyState } from "@astryxdesign/core";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <EmptyState
        title="Something went wrong"
        description="An unexpected error occurred while processing your request."
        icon="AlertTriangle"
        actions={
          <Button variant="secondary" label="Try again" onClick={() => reset()} />
        }
      />
    </div>
  );
}
