import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { getCurrentUser, checkEmergencyFreeze } from "@/lib/dal/auth";
import { gradingQueue } from "@/lib/workers/grading";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { applicationSchema } from "@/lib/validations/application";
import { eq, and } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: NextRequest) => {
try {
const rl = await checkRateLimit(req, "apply");
if (!rl.success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}

const session = await getCurrentUser();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

await checkEmergencyFreeze(session?.user?.role as string);

const body = await req.json();
const cycle = body.applicationCycle || "2026-odd-sem";

// Validate using Zod
const result = applicationSchema.safeParse(body);
if (!result.success && body.status !== "draft") {
  return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
}

const data = body; // Can use partial data for drafts

// Check if application exists
const existing = await db.query.applications.findFirst({
  where: and(
    eq(applications.userId, session.user.id),
    eq(applications.applicationCycle, cycle)
  )
});

const payload = {
  linkedinUrl: data.linkedinUrl || null,
  githubUrl: data.githubUrl || null,
  portfolioUrl: data.portfolioUrl || null,
  resumeUrl: data.resumeUrl || null,
  skills: data.skills || null,
  teamPreference: data.teamPreference || null,
  whyJoin: data.whyJoin || null,
  priorExperience: data.priorExperience || null,
  availability: data.availability || null,
  status: data.status === "draft" ? "draft" : "applied",
  answers: data, // Keep old field for backward compatibility
} as any;

let applicationId: string = crypto.randomUUID();

try {
  if (existing) {
    applicationId = existing.id;
    await db.update(applications)
      .set(payload)
      .where(eq(applications.id, existing.id));
  } else {
    await db.insert(applications).values({
      id: applicationId,
      userId: session.user.id,
      applicationCycle: cycle,
      ...payload
    });
  }
} catch (dbError: any) {
  if (dbError.code === "23505") { // Postgres unique_violation
    return NextResponse.json({ error: "You have already applied for this cycle." }, { status: 400 });
  }
  throw dbError;
}

// Only dispatch grading if not a draft
if (data.status !== "draft") {
  await gradingQueue.add("grade-application", {
    applicationId,
    answers: data,
  }, { jobId: crypto.createHash("sha256").update(`grade:${applicationId}`).digest("hex") });
}

return NextResponse.json({ success: true, applicationId });
} catch (error) {
console.error("Failed to submit application:", error);
return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
});
