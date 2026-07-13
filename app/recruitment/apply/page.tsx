import { db } from "@/lib/db";
import { formTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ApplyClient from "./apply-client";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  const [activeForm] = await db.select().from(formTemplates).where(eq(formTemplates.isActive, true));

  if (!activeForm) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-muted/20">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Applications Closed</h1>
          <p className="text-muted-foreground">There is no active application cycle at the moment. Please check back later.</p>
        </div>
      </div>
    );
  }

  return <ApplyClient activeForm={activeForm as any} />;
}
