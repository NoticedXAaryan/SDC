import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user, registrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireRole, checkEmergencyFreeze } from "@/lib/dal/auth";
import { z } from "zod";
import { nanoid } from "nanoid";
import { withApiHandler, AuthorizationError, ValidationError } from "@/lib/api-wrapper";

const walkInSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export const dynamic = "force-dynamic";

export const POST = withApiHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
try {
const session = await requireRole(["admin", "owner", "lead", "event_lead", "co_lead", "faculty_coordinator"]);
await checkEmergencyFreeze(session.user.role as string);

const body = await req.json();
const parsed = walkInSchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
}

const { name, email } = parsed.data;
const { id: eventId } = await params;

const result = await db.transaction(async (tx) => {
  // 1. Find or create user
  let [existingUser] = await tx.select().from(user).where(eq(user.email, email)).limit(1);
  
  if (!existingUser) {
    const newUserId = nanoid();
    [existingUser] = await tx.insert(user).values({
      id: newUserId,
      name,
      email,
      emailVerified: false,
      role: "member",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
  }

  // 2. Check if already registered
  const [existingReg] = await tx.select().from(registrations).where(
    and(
      eq(registrations.eventId, eventId),
      eq(registrations.userId, existingUser.id)
    )
  ).limit(1);

  if (existingReg) {
    if (existingReg.status === "checked_in") {
      return { reg: existingReg, status: "already_checked_in" };
    }
    
    const [updatedReg] = await tx.update(registrations)
      .set({ status: "checked_in", checkedInAt: new Date() })
      .where(eq(registrations.id, existingReg.id))
      .returning();
      
    return { reg: updatedReg, status: "updated_to_checked_in" };
  }

  // 3. Create new walk-in registration
  const newRegId = nanoid();
  const passCode = nanoid(10);
  
  const [newReg] = await tx.insert(registrations).values({
    id: newRegId,
    eventId,
    userId: existingUser.id,
    passCode,
    status: "checked_in",
    checkedInAt: new Date(),
    createdAt: new Date(),
  }).returning();

  return { reg: newReg, status: "new_walk_in" };
});

return NextResponse.json({ success: true, result });
} catch (error: any) {
if (error.name === "AuthorizationError") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
console.error("[Walk-in POST]:", error);
return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
});
