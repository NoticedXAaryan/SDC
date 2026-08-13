import { requireRole } from "@/lib/dal/auth";
import { CertificateBuilderClient } from "./cert-builder-client";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/astryx/page-header";

export const dynamic = "force-dynamic";

export default async function CreateCertificatePage() {
  await requireRole(["admin", "owner", "tech_lead", "lead", "event_lead"]);
  
  const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader 
        title="Create Certificate Template" 
        description="Design a new certificate template for an event."
      />
      
      <CertificateBuilderClient events={allEvents as any[]} />
    </div>
  );
}
