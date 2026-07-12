import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/dal/auth";
import { gradingQueue } from "@/lib/workers/grading";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.answers) {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    const applicationId = nanoid();

    // 1. Save application to DB
    await db.insert(applications).values({
      id: applicationId,
      userId: session.user.id,
      answers: body.answers,
      status: "applied",
    });

    // 2. Dispatch to AI Grading queue
    await gradingQueue.add("grade-application", {
      applicationId,
      answers: body.answers,
    });

    return NextResponse.json({ success: true, applicationId });
  } catch (error) {
    console.error("Failed to submit application:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
