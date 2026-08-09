"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { ErrorDisplay } from "@/components/app/error-display";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route segment error:", error);
  }, [error]);

  return (
    <ErrorDisplay
      icon={<AlertCircle className="h-8 w-8 text-red-500" />}
      title="Something went wrong!"
      description={error.message || "An unexpected error occurred while loading this page."}
      actionLabel="Try again"
      onAction={() => reset()}
    />
  );
}
