import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { redirect } from "next/navigation";
import { CreateEventWizard } from "./create-event-wizard";
import { PageHeader } from "@/components/astryx/page-header";

export default async function CreateEventPage() {
  const session = await requireSession();
  const userRole = session.user.role || "member";
  
  if (!isManagementRole(userRole)) {
    redirect("/events");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader 
        title="Create Event"
        description="Fill in the details to publish a new event to the dashboard."
      />
      <CreateEventWizard />
    </div>
  );
}
