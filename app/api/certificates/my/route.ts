import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificatesV2 } from "@/lib/db/schema";
import { requireSession } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";

export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();

  const certs = await db.query.certificatesV2.findMany({
    where: eq(certificatesV2.userId, session.user.id),
    orderBy: (c, { desc }) => desc(c.issuedAt)
  });

  return NextResponse.json(certs);
}, { requireRateLimit: false });
