import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificatesV2 } from "@/lib/db/schema";
import { requireSession } from "@/lib/dal/auth";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const certs = await db.query.certificatesV2.findMany({
      where: eq(certificatesV2.userId, session.user.id),
      orderBy: (c, { desc }) => desc(c.issuedAt)
    });

    return NextResponse.json(certs);
  } catch (error) {
    console.error("Fetch My Certificates Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
