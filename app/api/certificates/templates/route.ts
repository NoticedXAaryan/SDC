import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates } from "@/lib/db/schema";
import { withApiHandler } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async (req: NextRequest) => {
    const session = await requireSession();
    const userRole = session.user.role || "member";
    if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }
    const templates = await db.query.certTemplates.findMany({
      orderBy: (templates, { desc }) => [desc(templates.createdAt)]
    });
    return NextResponse.json({ success: true, templates });
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const userRole = session.user.role || "member";
  if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { name, eventId, backgroundUrl, fields } = body;

  if (!name) {
    return NextResponse.json({ success: false, error: "Missing name" }, { status: 400 });
  }

  const [template] = await db.insert(certTemplates).values({
    name,
    eventId: eventId || null,
    backgroundUrl: backgroundUrl || "https://pdfme.com/blank.pdf",
    fields: fields || [],
    createdBy: session.user.id
  }).returning();

  return NextResponse.json({ success: true, template });
});
