"use client";

import { useEffect } from "react";
import { Button, EmptyState, Center } from "@astryxdesign/core";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error caught:", error);
  }, [error]);

  return (
    <Center minHeight="60vh">
      <EmptyState
        title="Operation Failed"
        description="We encountered an issue loading this section of the dashboard."
        icon="AlertTriangle"
        actions={
          <Button variant="secondary" label="Retry Action" onClick={() => reset()} />
        }
      />
    </Center>
  );
}
