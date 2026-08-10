import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/astryx/page-header";
import { Button } from "@astryxdesign/core";
import Link from "next/link";
import { ExternalLink, Camera, FileText, LayoutTemplate, Settings, Users } from "lucide-react";
import { EventOverviewTab } from "./components/event-overview-tab";
import { EventRegistrationsTab } from "./components/event-registrations-tab";
import { EventScannerTab } from "./components/event-scanner-tab";
import { EventCommunicationsTab } from "./components/event-communications-tab";
import { EventCertificatesTab } from "./components/event-certificates-tab";
import { EventManageTabsNav } from "./components/event-manage-tabs-nav";
import { EmptyState } from "@/components/astryx/empty-state";

export const dynamic = "force-dynamic";

export default async function EventManagePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ tab?: string }>
}) {
  const { slug } = await params;
  const { tab = "overview" } = await searchParams;
  const session = await requireSession();
  
  if (!["owner", "admin", "lead", "co_lead", "event_lead"].includes(session.user.role as string)) {
    redirect(`/events/${slug}`);
  }

  const eventData = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  const event = eventData[0];
  
  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Manage: ${event.title}`}
        description={`${(event.status || "draft").toUpperCase()} • ${new Date(event.startsAt).toLocaleDateString()}`}
        primaryAction={
          <Button href={`/events/${event.slug}`} variant="secondary" label="View public page" icon={<ExternalLink className="w-4 h-4" />} />
        }
      />

      <EventManageTabsNav currentTab={tab} />

      <div className="w-full">
        {tab === "overview" && <EventOverviewTab event={event} />}
        {tab === "registrations" && <EventRegistrationsTab event={event} />}
        {tab === "sessions" && (
          <EmptyState 
            icon={<Users />} 
            title="Sessions Management" 
            description="Sessions management is coming soon." 
          />
        )}
        {tab === "scanner" && <EventScannerTab event={event} />}
        {tab === "communications" && <EventCommunicationsTab event={event} />}
        {tab === "certificates" && <EventCertificatesTab event={event} />}
        {tab === "settings" && (
          <EmptyState 
            icon={<Settings />} 
            title="Event Settings" 
            description="Event settings management is coming soon." 
          />
        )}
      </div>
    </div>
  );
}
