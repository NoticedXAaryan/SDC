import { requireAdmin } from "@/lib/dal/auth";
import { CertificateBuilderClient } from "./cert-builder-client";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function CreateCertificatePage() {
  await requireAdmin();
  
  const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Certificate Template</h1>
        <p className="text-muted-foreground">Design a new certificate template.</p>
      </div>
      
      <CertificateBuilderClient events={allEvents as any[]} />
    </div>
  );
}
