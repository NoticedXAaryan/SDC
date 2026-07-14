import { NextRequest, NextResponse } from "next/server";
import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { researchPapers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isManagement = isManagementRole(session.user.role as string);
    const isAdmin = ["admin", "owner"].includes(session.user.role as string);
    
    // Content Lead or Admin can view all, otherwise only approved
    const isContentLead = (session.user.role as string) === "content_lead" || (session.user.role as string) === "content_co_lead";
    const canViewAll = isAdmin || isContentLead;

    let conditions = undefined;
    if (!canViewAll) {
      conditions = eq(researchPapers.status, "approved");
    }

    const data = await db.select().from(researchPapers).where(conditions).orderBy(desc(researchPapers.createdAt));

    return NextResponse.json({ papers: data });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      const data = await db.select().from(researchPapers).where(eq(researchPapers.status, "approved")).orderBy(desc(researchPapers.createdAt));
      return NextResponse.json({ papers: data });
    }

  }
}

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireSession();
const reqBody = await req.json();

const { title, authors, url, publishedAt } = reqBody;

if (!title || !authors) {
  return NextResponse.json({ error: "Title and authors are required" }, { status: 400 });
}

const paperId = crypto.randomUUID();

await db.insert(researchPapers).values({
  id: paperId,
  userId: session.user.id,
  title,
  authors,
  url,
  publishedAt: publishedAt ? new Date(publishedAt) : null,
  status: "pending",
});

return NextResponse.json({ success: true, id: paperId }, { status: 201 });
});
