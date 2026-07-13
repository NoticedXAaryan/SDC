import { requireSession, requireLead } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { EditEventForm } from "@/components/events/edit-event-form";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Require Lead/Admin access to edit events
  await requireLead();
  
  const eventData = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const event = eventData[0];
  
  if (!event) {
    notFound();
  }

  return <EditEventForm event={event} />;
}
