import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/dal/auth";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();
    
    const { faceDescriptor } = body;
    
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json({ success: false, error: "Invalid face descriptor format. Expected 128-dimensional array." }, { status: 400 });
    }
    
    // Save to user table as stringified JSON array
    await db.update(user)
      .set({ faceDescriptor: JSON.stringify(faceDescriptor) })
      .where(eq(user.id, session.user.id));
      
    return NextResponse.json({ success: true, message: "Face successfully enrolled" });
  } catch (err: any) {
    console.error("Face enrollment error:", err);
    return NextResponse.json({ success: false, error: "Failed to save face enrollment" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await requireSession();
    
    await db.update(user)
      .set({ faceDescriptor: null })
      .where(eq(user.id, session.user.id));
      
    return NextResponse.json({ success: true, message: "Face enrollment removed" });
  } catch (err: any) {
    console.error("Face deletion error:", err);
    return NextResponse.json({ success: false, error: "Failed to remove face enrollment" }, { status: 500 });
  }
}
