"use client";

import { AlertCircle } from "lucide-react";
import { ErrorDisplay } from "@/components/app/error-display";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex h-screen w-full flex-col items-center justify-center p-8 space-y-4">
          <ErrorDisplay
            icon={<AlertCircle className="h-8 w-8 text-red-500" />}
            title="Critical Application Error"
            description={error.message || "A critical error occurred at the root of the application."}
            actionLabel="Try again"
            onAction={() => reset()}
          />
        </div>
      </body>
    </html>
  );
}
