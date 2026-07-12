import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, registrations, certificates, applications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    // A true GDPR delete should cascade or nullify identifying info
    // For simplicity in this implementation, we will soft delete the user
    // or mask the data. 

    // Delete related records (in reality we might want to anonymize)
    await db.delete(applications).where(eq(applications.userId, userId));
    await db.delete(registrations).where(eq(registrations.userId, userId));
    
    // Soft delete user
    await db.update(user).set({
      name: "Deleted User",
      email: `deleted_${userId}@example.com`,
      bio: null,
      links: null,
      skills: null,
      username: null
    }).where(eq(user.id, userId));

    return NextResponse.json({ success: true, message: "Account data anonymized successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
