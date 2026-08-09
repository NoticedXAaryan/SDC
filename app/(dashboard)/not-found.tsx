import { Search } from "lucide-react";
import { ErrorDisplay } from "@/components/app/error-display";

export default function DashboardNotFound() {
  return (
    <ErrorDisplay
      icon={<Search className="h-10 w-10" />}
      title="Page Not Found"
      description="The page you're looking for doesn't exist or you don't have permission to view it."
      actionLabel="Back to Dashboard"
      actionHref="/dashboard"
    />
  );
}
