import { NextResponse } from "next/server";
import { requireSession } from "@/lib/dal/auth";
import { db } from "@/lib/db";
import { account, applications, certificates, registrations, session as authSession, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withApiHandler } from "@/lib/api-wrapper";
import { logger } from "@/lib/logger";
import { getStorageService } from "@/lib/services/storage";

export const DELETE = withApiHandler(async () => {
  const currentSession = await requireSession();
  const userId = currentSession.user.id;

  const [profileRows, applicationFiles, certificateFiles] = await Promise.all([
    db.select({ image: user.image }).from(user).where(eq(user.id, userId)).limit(1),
    db.select({ resumeUrl: applications.resumeUrl }).from(applications).where(eq(applications.userId, userId)),
    db.select({ pdfUrl: certificates.pdfUrl }).from(certificates).where(eq(certificates.userId, userId)),
  ]);

  await db.transaction(async (tx) => {
    await tx.delete(applications).where(eq(applications.userId, userId));
    await tx.delete(certificates).where(eq(certificates.userId, userId));
    await tx.delete(registrations).where(eq(registrations.userId, userId));

    // Revoke every login method and active session before anonymizing the retained row.
    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(authSession).where(eq(authSession.userId, userId));

    await tx.update(user).set({
      name: "Deleted User",
      email: `deleted_${userId}@invalid.local`,
      emailVerified: false,
      image: null,
      role: "outsider",
      banned: true,
      banReason: "Account deleted by user",
      username: null,
      usernameLower: null,
      displayName: null,
      year: null,
      branch: null,
      bio: null,
      links: null,
      skills: null,
      privacy: null,
      faceDescriptor: null,
      deletedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(user.id, userId));
  });

  const fileUrls = [
    profileRows[0]?.image,
    ...applicationFiles.map((item) => item.resumeUrl),
    ...certificateFiles.map((item) => item.pdfUrl),
  ].filter((url): url is string => Boolean(url));
  const storage = getStorageService();
  const deletionResults = await Promise.allSettled(fileUrls.map((url) => storage.deleteFile(url)));
  const failedFileDeletes = deletionResults.filter((result) => result.status === "rejected").length;
  if (failedFileDeletes > 0) {
    logger.warn({ userId, failedFileDeletes }, "Account anonymized but some stored files could not be deleted");
  }

  return NextResponse.json({ success: true, message: "Account data anonymized successfully" });
});
