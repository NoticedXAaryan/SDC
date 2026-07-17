import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { redirect } from "next/navigation";
import { CreateEventWizard } from "./create-event-wizard";

export default async function CreateEventPage() {
  const session = await requireSession();
  const userRole = session.user.role || "member";
  
  if (!isManagementRole(userRole)) {
    redirect("/events");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Event</h1>
        <p className="text-muted-foreground">
          Fill in the details to publish a new event to the dashboard.
        </p>
      </div>
      <CreateEventWizard />
    </div>
  );
}
