"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

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
    <div className="flex h-full w-full flex-col items-center justify-center p-8 space-y-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-muted-foreground mb-4">
            {error.message || "An unexpected error occurred while loading this page."}
          </p>
          <Button variant="outline" onClick={() => reset()}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}
