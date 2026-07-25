import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { certTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

export const PATCH = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
const { id } = await params;
const session = await requireSession();

// Check role (must be at least lead)
const userRole = session.user.role || "member";
if (!["owner", "admin", "lead", "co_lead"].includes(userRole as string)) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
}

const body = await req.json();
const { schemas, basePdf } = body;

if (!schemas || !basePdf) {
  return NextResponse.json({ success: false, error: "Missing schemas or basePdf" }, { status: 400 });
}

await db.update(certTemplates)
  .set({ fields: schemas, backgroundUrl: basePdf })
  .where(eq(certTemplates.id, id));

return NextResponse.json({ success: true });
});

export const GET = withApiHandler(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  await requireSession();
  
  const templateRows = await db.select().from(certTemplates).where(eq(certTemplates.id, id)).limit(1);
  const template = templateRows[0];
  
  if (!template) {
    return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, template });
}, { requireRateLimit: false });
