import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { withApiHandler } from "@/lib/api-wrapper";
import { RECRUITMENT_REVIEWER_ROLES } from "@/lib/services/applications";
import { z } from "zod";

const cycleSchema = z.string().trim().min(1).max(100);

function protectSpreadsheetCell(value: unknown) {
  if (typeof value !== "string") return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireRole(RECRUITMENT_REVIEWER_ROLES);
  const url = new URL(req.url);
  const parsedCycle = cycleSchema.safeParse(url.searchParams.get("cycle"));

  if (!parsedCycle.success) {
    return NextResponse.json({ error: "Cycle is required" }, { status: 400 });
  }
  const cycle = parsedCycle.data;

  const data = await db.select({
    id: applications.id,
    userId: applications.userId,
    name: user.name,
    email: user.email,
    status: applications.status,
    answers: applications.answers,
    aiScore: applications.aiScore,
    createdAt: applications.createdAt,
  })
  .from(applications)
  .leftJoin(user, eq(user.id, applications.userId))
  .where(eq(applications.applicationCycle, cycle));

  const flatData = data.map((d) => {
    const answers = d.answers as Record<string, any> || {};
    return {
      ID: d.id,
      Name: protectSpreadsheetCell(d.name),
      Email: protectSpreadsheetCell(d.email),
      Status: protectSpreadsheetCell(d.status),
      AiScore: d.aiScore,
      CreatedAt: d.createdAt,
      ...Object.fromEntries(
        Object.entries(answers).map(([key, value]) => [key, protectSpreadsheetCell(value)]),
      ),
    };
  });

  const csv = Papa.unparse(flatData);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-${cycle.replace(/[^a-zA-Z0-9_-]+/g, "-")}.csv"`,
    },
  });
}, { requireRateLimit: false });
