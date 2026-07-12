import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const applySchema = z.object({
  year: z.number().min(1).max(5),
  branch: z.string().min(2),
  bio: z.string().max(500).optional(),
  skills: z.array(z.string()).optional(),
  links: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "applicant") {
      return NextResponse.json({ error: "Only applicants can apply" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = applySchema.parse(body);

    await db.update(user)
      .set({
        year: parsed.year,
        branch: parsed.branch,
        bio: parsed.bio,
        skills: parsed.skills, // Skills is jsonb
        links: parsed.links,   // Links is jsonb
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ message: "Application submitted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
