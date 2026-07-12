import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { researchPapers, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Only content leads and admins can approve research papers
    await requireRole(["content_lead", "admin", "owner"]);
    
    const { id: paperId } = await params;
    const reqBody = await req.json().catch(() => ({}));
    const newStatus = reqBody.status; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const [updated] = await db.update(researchPapers)
      .set({ status: newStatus as "approved" | "rejected" | "pending" })
      .where(eq(researchPapers.id, paperId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Research paper not found" }, { status: 404 });
    }

    // If approved, broadcast a global announcement
    if (newStatus === "approved") {
      const { user } = await import("@/lib/db/schema");
      const { ne } = await import("drizzle-orm");
      
      const allMembers = await db.select({ id: user.id })
        .from(user)
        .where(ne(user.role, "outsider"));
        
      const notifsToInsert = allMembers.map(m => ({
        id: crypto.randomUUID(),
        userId: m.id,
        type: "research_published",
        title: "New Research Paper Published!",
        message: `Check out the new research paper: ${updated.title}`,
        link: updated.url || `/research`
      }));

      // Batch insert notifications
      if (notifsToInsert.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < notifsToInsert.length; i += chunkSize) {
          const chunk = notifsToInsert.slice(i, i + chunkSize);
          await db.insert(notifications).values(chunk);
        }
      }
    }

    return NextResponse.json({ success: true, paper: updated });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[Research Approve PATCH]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
