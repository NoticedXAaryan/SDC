import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, Camera, FileText, LayoutTemplate, Settings, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventOverviewTab } from "./components/event-overview-tab";
import { EventRegistrationsTab } from "./components/event-registrations-tab";
import { EventScannerTab } from "./components/event-scanner-tab";
import { EventCommunicationsTab } from "./components/event-communications-tab";
import { EventCertificatesTab } from "./components/event-certificates-tab";

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
          <Button asChild variant="outline">
            <Link href={`/events/${event.slug}`}>
              View public page <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        }
      />

      <Tabs defaultValue={tab} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <EventOverviewTab event={event} />
        </TabsContent>
        <TabsContent value="registrations">
          <EventRegistrationsTab event={event} />
        </TabsContent>
        <TabsContent value="sessions">
          <div className="p-6 border rounded-lg bg-card text-center text-muted-foreground">Sessions management coming soon</div>
        </TabsContent>
        <TabsContent value="scanner">
          <EventScannerTab event={event} />
        </TabsContent>
        <TabsContent value="communications">
          <EventCommunicationsTab event={event} />
        </TabsContent>
        <TabsContent value="certificates">
          <EventCertificatesTab event={event} />
        </TabsContent>
        <TabsContent value="settings">
          <div className="p-6 border rounded-lg bg-card text-center text-muted-foreground">Event settings coming soon</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
