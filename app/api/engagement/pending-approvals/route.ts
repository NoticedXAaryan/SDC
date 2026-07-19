import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, procurementRequests, contentItems, achievementSubmissions } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

// P7-02: Unified pending-approvals endpoint
export const GET = withApiHandler(async () => {
  await requireRole(["event_lead", "lead", "vice_lead", "finance_lead", "marketing_lead", "content_lead", "admin", "owner"]);
  
  const [pendingApps, pendingProcs, pendingContent, pendingAchvs] = await Promise.all([
    db.select().from(applications).where(
      or(eq(applications.status, "applied"), eq(applications.status, "needs_manual_review"))
    ),
    db.select().from(procurementRequests).where(eq(procurementRequests.status, "approval")),
    db.select().from(contentItems).where(eq(contentItems.status, "review")),
    db.select().from(achievementSubmissions).where(eq(achievementSubmissions.status, "pending")),
  ]);

  const aggregated = [
    ...pendingApps.map(a => ({ type: "application", id: a.id, title: `Application`, status: a.status, createdAt: a.createdAt })),
    ...pendingProcs.map(p => ({ type: "procurement", id: p.id, title: p.title, status: p.status, createdAt: p.createdAt })),
    ...pendingContent.map(c => ({ type: "content", id: c.id, title: c.title, status: c.status, createdAt: c.createdAt })),
    ...pendingAchvs.map(a => ({ type: "achievement", id: a.id, title: a.title, status: a.status, createdAt: a.createdAt })),
  ];

  aggregated.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime; // Oldest first
  });

  return NextResponse.json(aggregated);
}, { requireRateLimit: false });
