import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { user, registrations, certificates, applications, inventoryLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";

export const GET = withApiHandler(async (req: NextRequest) => {
  const session = await requireSession();
  const userId = session.user.id;

  const [userData, userRegs, userCerts, userApps, userInvLogs] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1),
    db.select().from(registrations).where(eq(registrations.userId, userId)),
    db.select().from(certificates).where(eq(certificates.userId, userId)),
    db.select().from(applications).where(eq(applications.userId, userId)),
    db.select().from(inventoryLogs).where(eq(inventoryLogs.userId, userId)),
  ]);

  const exportData = {
    profile: userData[0],
    registrations: userRegs,
    certificates: userCerts,
    applications: userApps,
    inventoryLogs: userInvLogs,
    exportedAt: new Date().toISOString()
  };

  return NextResponse.json({ success: true, data: exportData });
}, { requireRateLimit: false });
