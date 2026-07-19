import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export default function EventNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="rounded-full bg-muted p-6">
        <Calendar className="h-12 w-12 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Event Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          The event you're looking for doesn't exist or may have been removed.
        </p>
      </div>
      <Button asChild>
        <Link href="/events">Browse All Events</Link>
      </Button>
    </div>
  );
}
