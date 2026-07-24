import { NextRequest, NextResponse } from "next/server";
import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { projects, projectMembers, projectImages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
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

    const data = await db.query.projects.findMany({
      where: conditions,
      orderBy: [desc(projects.createdAt)],
      with: {
        teamMembers: true,
        images: true
      }
    });

    return NextResponse.json({ projects: data });
  });

export const POST = withApiHandler(async (req: NextRequest) => {
const session = await requireSession();
const reqBody = await req.json();

const rl = await checkRateLimit(req, "submit_project");
if (!rl.success) {
  return NextResponse.json({ error: rl.error }, { status: 429 });
}

const { title, description, githubUrl, liveUrl, teamMembers, images } = reqBody;

if (!title || !description) {
  return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
}

const projectId = crypto.randomUUID();

await db.transaction(async (tx) => {
  await tx.insert(projects).values({
    id: projectId,
    title,
    description,
    githubUrl,
    liveUrl,
    status: "pending",
  });

  if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
    await tx.insert(projectMembers).values(
      teamMembers.map((m: any) => ({
        projectId,
        name: m.name,
        role: m.role,
        githubUrl: m.githubUrl || m.github,
        twitterUrl: m.twitterUrl || m.twitter
      }))
    );
  }

  if (images && Array.isArray(images) && images.length > 0) {
    await tx.insert(projectImages).values(
      images.map((url: string, index: number) => ({
        projectId,
        url,
        orderIndex: index
      }))
    );
  }
});

return NextResponse.json({ success: true, id: projectId }, { status: 201 });
});
