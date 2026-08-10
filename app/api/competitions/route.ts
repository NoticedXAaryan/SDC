import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { competitions, user } from "@/lib/db/schema";
import { requireSession } from "@/lib/dal/auth";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import crypto from "crypto";

const createCompetitionSchema = z.object({
  title: z.string().min(1),
  date: z.string(), // ISO
  position: z.string(),
  url: z.string().url().optional().or(z.literal("")),
});

export const GET = withApiHandler(async (req: Request) => {
  const session = await requireSession();
  
  const allCompetitions = await db.select({
    id: competitions.id,
    title: competitions.title,
    date: competitions.date,
    position: competitions.position,
    url: competitions.url,
    createdAt: competitions.createdAt,
    userName: user.name,
  })
  .from(competitions)
  .leftJoin(user, eq(competitions.userId, user.id))
  .orderBy(desc(competitions.createdAt));
  
  return NextResponse.json(allCompetitions);
});

export const POST = withApiHandler(async (req: Request) => {
  const session = await requireSession();
  
  const body = await req.json();
  const parsed = createCompetitionSchema.parse(body);
  
  const [newCompetition] = await db.insert(competitions).values({
    id: crypto.randomUUID(),
    title: parsed.title,
    date: new Date(parsed.date),
    position: parsed.position,
    url: parsed.url || null,
    userId: session.user.id,
  }).returning();
  
  return NextResponse.json(newCompetition, { status: 201 });
});
