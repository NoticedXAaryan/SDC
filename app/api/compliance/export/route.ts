import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { achievementSubmissions, applications, certificates, formResponses, inventoryLogs, pointLogs, projects, registrations, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";

export const GET = withApiHandler(async () => {
  const session = await requireSession();
  const userId = session.user.id;

  const [userData, userRegs, userCerts, userApps, userInvLogs, userAchievements, userFormResponses, userPointLogs, userProjects] = await Promise.all([
    db.select().from(user).where(eq(user.id, userId)).limit(1),
    db.select().from(registrations).where(eq(registrations.userId, userId)),
    db.select().from(certificates).where(eq(certificates.userId, userId)),
    db.select().from(applications).where(eq(applications.userId, userId)),
    db.select().from(inventoryLogs).where(eq(inventoryLogs.userId, userId)),
    db.select().from(achievementSubmissions).where(eq(achievementSubmissions.userId, userId)),
    db.select().from(formResponses).where(eq(formResponses.userId, userId)),
    db.select().from(pointLogs).where(eq(pointLogs.userId, userId)),
    db.select().from(projects).where(eq(projects.submittedBy, userId)),
  ]);

  const exportData = {
    profile: userData[0],
    registrations: userRegs,
    certificates: userCerts,
    applications: userApps,
    inventoryLogs: userInvLogs,
    achievements: userAchievements,
    formResponses: userFormResponses,
    pointHistory: userPointLogs,
    submittedProjects: userProjects,
    exportedAt: new Date().toISOString()
  };

  return NextResponse.json({ success: true, data: exportData });
}, { requireRateLimit: false });
