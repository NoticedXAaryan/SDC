import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/dal/auth";
import { gradingQueue } from "@/lib/workers/grading";
import { nanoid } from "nanoid";

import crypto from "crypto";

import { checkRateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await checkRateLimit(req, "apply");
    if (!rl.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.answers || !body.applicationCycle) {
      return NextResponse.json({ error: "Answers and applicationCycle are required" }, { status: 400 });
    }

    const applicationId = nanoid();

    try {
      const { checkEmergencyFreeze } = await import("@/lib/dal/auth");
      await checkEmergencyFreeze(session?.user?.role as string);

      // 1. Save application to DB
      await db.insert(applications).values({
        id: applicationId,
        userId: session.user.id,
        applicationCycle: body.applicationCycle,
        answers: body.answers,
        status: "applied",
      });
    } catch (dbError: any) {
      if (dbError.code === "23505") { // Postgres unique_violation
        return NextResponse.json({ error: "You have already applied for this cycle." }, { status: 400 });
      }
      throw dbError;
    }

    // 2. Dispatch to AI Grading queue
    await gradingQueue.add("grade-application", {
      applicationId,
      answers: body.answers,
    }, { jobId: crypto.createHash("sha256").update(`grade:${applicationId}`).digest("hex") });

    return NextResponse.json({ success: true, applicationId });
  } catch (error) {
    console.error("Failed to submit application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
