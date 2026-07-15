import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { applications, formTemplates } from "@/lib/db/schema";
import { getCurrentUser, checkEmergencyFreeze } from "@/lib/dal/auth";
import { gradingQueue } from "@/lib/queues/grading";
import { nanoid } from "nanoid";
import crypto from "crypto";
import { checkRateLimit } from "@/lib/rate-limit";
import { applicationSchema } from "@/lib/validations/application";
import { eq, and } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (req: NextRequest) => {
const rl = await checkRateLimit(req, "apply");
if (!rl.success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}

const idemKey = req.headers.get("x-idempotency-key");
if (idemKey) {
  const { getRedisClient } = await import("@/lib/redis");
  const redis = getRedisClient();
  const seen = await redis.get(`idem:${idemKey}`);
  if (seen) {
    return NextResponse.json(JSON.parse(seen));
  }
}

const session = await getCurrentUser();
if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

await checkEmergencyFreeze(session?.user?.role as string);

const body = await req.json();
const cycle = body.applicationCycle || "2026-odd-sem";

// 0. Honeypot check
if (body.honeypot) {
  // If the hidden honeypot field is filled, it's a bot
  return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
}

// 1. Turnstile validation
const { validateTurnstile } = await import("@/lib/turnstile");
const turnstileValid = await validateTurnstile(body.turnstileToken || req.headers.get("x-turnstile-token"));
if (!turnstileValid) {
  return NextResponse.json({ error: "Invalid captcha token" }, { status: 400 });
}

// Validate against active form template
const [activeForm] = await db.select().from(formTemplates).where(eq(formTemplates.isActive, true)).limit(1);

if (!activeForm && body.status !== "draft") {
  return NextResponse.json({ error: "No active application cycle found" }, { status: 400 });
}

if (activeForm && body.status !== "draft") {
  const fields = activeForm.fields as any[];
  const answers = body.answers || body;
  const missingFields = fields
    .filter(f => f.required)
    .filter(f => !answers[f.id] || String(answers[f.id]).trim() === "");

  if (missingFields.length > 0) {
    return NextResponse.json({ 
      error: "Validation failed", 
      details: { missing: missingFields.map(f => f.id) } 
    }, { status: 400 });
  }
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

const responseBody = { success: true, applicationId };

if (idemKey) {
  const { getRedisClient } = await import("@/lib/redis");
  await getRedisClient().setex(`idem:${idemKey}`, 86400, JSON.stringify(responseBody));
}

return NextResponse.json(responseBody);
});
