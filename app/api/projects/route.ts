import { NextRequest, NextResponse } from "next/server";
import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const isManagement = isManagementRole(session.user.role as string);
    const isAdmin = ["admin", "owner"].includes(session.user.role as string);
    
    // Tech Lead or Admin can view all, otherwise only approved
    const isTechLead = (session.user.role as string) === "tech_lead" || (session.user.role as string) === "co_lead";
    const canViewAll = isAdmin || isTechLead;

    let conditions = undefined;
    if (!canViewAll) {
      conditions = eq(projects.status, "approved");
    }

    const data = await db.select().from(projects).where(conditions).orderBy(desc(projects.createdAt));

    return NextResponse.json({ projects: data });
  } catch (error: any) {
    if (error.name === "AuthorizationError") {
      // Unauthenticated users can only see approved projects
      const data = await db.select().from(projects).where(eq(projects.status, "approved")).orderBy(desc(projects.createdAt));
      return NextResponse.json({ projects: data });
    }

  }
}

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireSession();
const reqBody = await req.json();

const { title, description, githubUrl, liveUrl, teamMembers, images } = reqBody;

if (!title || !description) {
  return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
}

const projectId = crypto.randomUUID();

await db.insert(projects).values({
  id: projectId,
  title,
  description,
  githubUrl,
  liveUrl,
  teamMembers,
  images,
  status: "pending",
});

return NextResponse.json({ success: true, id: projectId }, { status: 201 });
});
