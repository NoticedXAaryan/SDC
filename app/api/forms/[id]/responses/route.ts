import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { forms, formResponses } from "@/lib/db/schema";
import { requireSession } from "@/lib/dal/auth";
import { eq, and } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const session = await requireSession();
    const user = session?.user;

    const [form] = await db.query.forms.findMany({
      where: eq(forms.id, id),
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 404 });
    }

    if (form.status !== "published") {
      return NextResponse.json({ error: "Form is not accepting responses" }, { status: 400 });
    }

    const settings = form.settings as any;

    if (!settings.allowExternal && !user) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    if (settings.collegeDomainOnly && user && !user.email?.endsWith("college.edu.in")) {
      return NextResponse.json({ error: "College domain only" }, { status: 403 });
    }

    // Rate Limiting
    const rateLimit = await checkRateLimit(req as any, `form_submit_${id}`);
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Quota Logic
    if (user && !settings.allowMultiple) {
      const existingResponses = await db.query.formResponses.findMany({
        where: and(
          eq(formResponses.formId, id),
          eq(formResponses.userId, user.id)
        ),
      });

      const quotaPerUser = settings.quotaPerUser || 1;
      if (existingResponses.length >= quotaPerUser) {
        return NextResponse.json({ error: `You have reached the maximum allowed submissions (${quotaPerUser})` }, { status: 429 });
      }
    }

    // Insert response
    const [response] = await db.insert(formResponses).values({
      formId: id,
      userId: user?.id,
      answers: body.answers,
    }).returning();

    return NextResponse.json({ success: true, responseId: response.id });
  } catch (error) {
    console.error("Form Submission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireSession();
    
    // Only leads and above can view responses
    if (!session || !["admin", "owner", "lead"].includes(session.user.role as string)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const responses = await db.query.formResponses.findMany({
      where: eq(formResponses.formId, id),
      orderBy: (fr, { desc }) => desc(fr.createdAt),
    });

    return NextResponse.json({ responses });
  } catch (error) {
    console.error("Form Responses Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
