import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applications, user } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { withApiHandler } from "@/lib/api-wrapper";

export const GET = withApiHandler(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const cycle = url.searchParams.get("cycle");

  if (!cycle) {
    return NextResponse.json({ error: "Cycle is required" }, { status: 400 });
  }

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
      Name: d.name,
      Email: d.email,
      Status: d.status,
      AiScore: d.aiScore,
      CreatedAt: d.createdAt,
      ...answers // Flatten JSON answers into CSV columns
    };
  });

  const csv = Papa.unparse(flatData);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications-${cycle}.csv"`,
    },
  });
}, { requireRateLimit: false });
