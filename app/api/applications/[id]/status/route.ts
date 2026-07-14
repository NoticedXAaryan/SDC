import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { withApiHandler } from "@/lib/api-wrapper";

const statusSchema = z.object({
  status: z.enum(["draft", "applied", "ai_graded", "needs_manual_review", "interviewing", "accepted", "rejected"]),
  domain: z.string().optional(),
});

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await params;
    await requireAdmin();
    const body = await req.json();
    const { status, domain } = statusSchema.parse(body);

    const [app] = await db.select().from(applications).where(eq(applications.id, resolvedParams.id));
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const [updated] = await db.update(applications)
      .set({ status })
      .where(eq(applications.id, resolvedParams.id))
      .returning();

    // If accepted, update the user role to member and allot domain
    if (status === "accepted") {
      await db.update(user)
        .set({ role: "member" })
        .where(eq(user.id, app.userId));
        
      // Future: add to member table with domain allocation
    }

    return NextResponse.json(updated);
});
