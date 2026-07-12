import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, registrations, certificates, applications, inventoryLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const [userData] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    const userRegs = await db.select().from(registrations).where(eq(registrations.userId, userId));
    const userCerts = await db.select().from(certificates).where(eq(certificates.userId, userId));
    const userApps = await db.select().from(applications).where(eq(applications.userId, userId));
    const userInvLogs = await db.select().from(inventoryLogs).where(eq(inventoryLogs.userId, userId));

    const exportData = {
      profile: userData,
      registrations: userRegs,
      certificates: userCerts,
      applications: userApps,
      inventoryLogs: userInvLogs,
      exportedAt: new Date().toISOString()
    };

    return NextResponse.json({ success: true, data: exportData });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
