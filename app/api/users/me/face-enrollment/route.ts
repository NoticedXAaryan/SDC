import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession, checkEmergencyFreeze } from "@/lib/dal/auth";
import { withApiHandler } from "@/lib/api-wrapper";

export const POST = withApiHandler(async (request: NextRequest) => {
    const session = await requireSession();
    
    
    const body = await request.json();
    
    const { faceDescriptor } = body;
    
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json({ success: false, error: "Invalid face descriptor format. Expected 128-dimensional array." }, { status: 400 });
    }
    
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
    const session = await requireSession();
    
    
    
    await db.update(user)
      .set({ faceDescriptor: null })
      .where(eq(user.id, session.user.id));
      
    return NextResponse.json({ success: true, message: "Face enrollment removed" });
});
