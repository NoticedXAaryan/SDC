import { NextRequest, NextResponse } from "next/server";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { auditLogs, projects, projectMembers, projectImages } from "@/lib/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { checkRateLimit } from "@/lib/rate-limit";
import { PROJECT_REVIEW_ROLES } from "@/lib/domain/projects";
import { createProjectSchema } from "@/lib/validators/projects";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
    const session = await requireSession();
    const canViewAll = (PROJECT_REVIEW_ROLES as readonly string[]).includes(session.user.role as string);

    let conditions = undefined;
    if (!canViewAll) {
      conditions = or(eq(projects.status, "approved"), eq(projects.submittedBy, session.user.id));
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
await checkEmergencyFreeze(session.user.role as string);
const reqBody = await req.json();

const rl = await checkRateLimit(req, "submit_project");
if (!rl.success) {
  return NextResponse.json({ error: rl.error }, { status: 429 });
}

const parsed = createProjectSchema.safeParse(reqBody);
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid project submission", details: parsed.error.flatten() }, { status: 400 });
}
const { title, description, githubUrl, liveUrl, teamMembers, images } = parsed.data;

const projectId = crypto.randomUUID();

await db.transaction(async (tx) => {
  await tx.insert(projects).values({
    id: projectId,
    title,
    description,
    githubUrl,
    liveUrl,
    status: "pending",
    submittedBy: session.user.id,
  });

  if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
    await tx.insert(projectMembers).values(
      teamMembers.map((member) => ({
        projectId,
        name: member.name,
        role: member.role,
        githubUrl: member.githubUrl || null,
        twitterUrl: member.twitterUrl || null,
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

  await tx.insert(auditLogs).values({
    id: crypto.randomUUID(),
    actorId: session.user.id,
    action: "project_submitted",
    entity: "project",
    entityId: projectId,
    details: JSON.stringify({ title }),
    timestamp: new Date(),
  });
});

return NextResponse.json({ success: true, id: projectId }, { status: 201 });
});
