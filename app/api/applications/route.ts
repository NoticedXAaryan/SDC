import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { formTemplates } from "@/lib/db/schema";
import { getCurrentUser, checkEmergencyFreeze } from "@/lib/dal/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { ApplicationService } from "@/lib/services/applications";

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

  try {
    const responseBody = await ApplicationService.submitApplication(session.user.id, body, cycle);

    if (idemKey) {
      const { getRedisClient } = await import("@/lib/redis");
      await getRedisClient().setex(`idem:${idemKey}`, 86400, JSON.stringify(responseBody));
    }

    return NextResponse.json(responseBody);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
