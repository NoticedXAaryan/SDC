import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificatesV2 } from "@/lib/db/schema";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const GET = withApiHandler(async () => {
  await requireRole(["admin", "owner", "lead", "co_lead"]);
  const certs = await db.query.certificatesV2.findMany({
    orderBy: [desc(certificatesV2.issuedAt)],
    limit: 100, // For management view
  });
  return NextResponse.json(certs);
});
