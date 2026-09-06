import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";
import { z } from "zod";

const descriptorSchema = z.object({
  faceDescriptor: z.array(z.number().finite().min(-2).max(2)).length(128),
});

export const POST = withApiHandler(async (request: NextRequest) => {
    const session = await requireRole(["member", "alumni", "co_lead", "event_lead", "lead", "admin", "owner"]);
    
    
    const parsed = descriptorSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid face descriptor format. Expected 128-dimensional array." }, { status: 400 });
    }
    const { faceDescriptor } = parsed.data;
    
    // Quality & Variance Check: Prevent dummy vectors (e.g. all zeros, or exact same numbers)
    const variance = faceDescriptor.reduce((a, b) => a + Math.abs(b), 0);
    if (variance < 0.1) {
      return NextResponse.json({ success: false, error: "Face descriptor lacks variance. Ensure your camera is clear and well-lit." }, { status: 400 });
    }
    
    // Save to user table as stringified JSON array
    await db.update(user)
      .set({ faceDescriptor: JSON.stringify(faceDescriptor) })
      .where(eq(user.id, session.user.id));
      
    return NextResponse.json({ success: true, message: "Face successfully enrolled" });
});

export const DELETE = withApiHandler(async (request: NextRequest) => {
    const session = await requireRole(["member", "alumni", "co_lead", "event_lead", "lead", "admin", "owner"]);
    
    
    
    await db.update(user)
      .set({ faceDescriptor: null })
      .where(eq(user.id, session.user.id));
      
    return NextResponse.json({ success: true, message: "Face enrollment removed" });
});
