import { requireSession, isManagementRole } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiHandler, AuthorizationError } from "@/lib/api-wrapper";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  type: z.enum(["cultural", "technical", "sports", "general"]).optional().default("general"),
  description: z.string().optional(),
  coverImage: z.string().optional(),
  startsAt: z.coerce.date().refine(d => d > new Date(), { message: "Event must start in the future" }),
  endsAt: z.coerce.date(),
  location: z.string().optional(),
  capacity: z.number().min(0).optional(),
  isPaid: z.boolean().optional(),
  price: z.number().min(0).optional(),
  forms: z.array(z.any()).optional(),
  certificateTemplateId: z.string().optional(),
}).refine(data => data.endsAt > data.startsAt, {
  message: "End time must be after start time",
  path: ["endsAt"],
});

export const POST = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const userRole = session.user.role || "member";
  
  if (!isManagementRole(userRole)) {
    throw new AuthorizationError("Unauthorized");
  }

  const body = await req.json();
  const validated = createEventSchema.parse(body);

  const inserted = await db.insert(events).values({
    title: validated.title,
    slug: validated.slug,
    type: validated.type as any,
    description: validated.description,
    coverImage: validated.coverImage,
    startsAt: new Date(validated.startsAt),
    endsAt: new Date(validated.endsAt),
    location: validated.location,
    capacity: validated.capacity,
    isPaid: validated.isPaid,
    price: validated.price ? validated.price.toString() : "0",
    status: userRole === "admin" ? "published" : "draft", // DFD 27: Lead requires approval
    createdBy: session.user.id,
    forms: validated.forms,
    certificateTemplateId: validated.certificateTemplateId || null,
  }).returning();

  return NextResponse.json({ event: inserted[0] });
});
