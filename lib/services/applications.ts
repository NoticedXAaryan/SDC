import { db } from "@/lib/db";
import { applications, user, formTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { emailQueue } from "@/lib/queues/email";
import { gradingQueue } from "@/lib/queues/grading";
import { NotificationService } from "@/lib/services/notifications";
import crypto from "crypto";

export class ApplicationService {
  /**
   * Updates an application status and dispatches appropriate queues/notifications
   */
  static async updateApplicationStatus(id: string, status: string) {
    const [updatedApp] = await db
      .update(applications)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();

    if (!updatedApp) {
      throw new Error("Application not found");
    }

    // If moving to interviewing, send an email invite automatically
    if (status === "interviewing") {
      const [applicant] = await db.select({ email: user.email, name: user.name })
        .from(applications)
        .innerJoin(user, eq(applications.userId, user.id))
        .where(eq(applications.id, id));

      if (applicant) {
        await emailQueue.add("send-email", {
          to: applicant.email,
          subject: "Interview Invitation — Student Developer Club",
          html: `<p>Hi ${applicant.name},</p><p>Congratulations! We have reviewed your application and would like to invite you to an interview.</p><p>Please check your student portal for scheduling details.</p>`,
        }, { jobId: crypto.createHash("sha256").update(`interview:${id}`).digest("hex") });
      }
    }

    // In-app notification for status changes
    const statusMessages: Record<string, { title: string; message: string }> = {
      accepted: { title: "Application Accepted! 🎉", message: "Congratulations! Your application to join the club has been accepted." },
      rejected: { title: "Application Update", message: "We appreciate your interest but were unable to accept your application at this time." },
      interviewing: { title: "Interview Invitation", message: "You've been invited for an interview! Check your email for details." },
      ai_graded: { title: "Application Under Review", message: "Your application is being reviewed. We'll notify you soon." },
    };

    if (statusMessages[status] && updatedApp?.userId) {
      void NotificationService.sendInAppNotification({
        userId: updatedApp.userId,
        type: "system",
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        link: "/recruitment/apply",
      });
    }

    return updatedApp;
  }

  /**
   * Submits or drafts an application and triggers grading if necessary
   */
  static async submitApplication(userId: string, data: any, cycle: string) {
    // Check if application exists
    const existing = await db.query.applications.findFirst({
      where: and(
        eq(applications.userId, userId),
        eq(applications.applicationCycle, cycle)
      )
    });

    const payload = {
      linkedinUrl: data.linkedinUrl || null,
      githubUrl: data.githubUrl || null,
      portfolioUrl: data.portfolioUrl || null,
      resumeUrl: data.resumeUrl || null,
      skills: data.skills || null,
      teamPreference: data.teamPreference || null,
      whyJoin: data.whyJoin || null,
      priorExperience: data.priorExperience || null,
      availability: data.availability || null,
      status: data.status === "draft" ? "draft" : "applied",
      answers: data, // Keep old field for backward compatibility
    } as any;

    let applicationId: string = crypto.randomUUID();

    try {
      if (existing) {
        applicationId = existing.id;
        await db.update(applications)
          .set(payload)
          .where(eq(applications.id, existing.id));
      } else {
        await db.insert(applications).values({
          id: applicationId,
          userId: userId,
          applicationCycle: cycle,
          ...payload
        });
      }
    } catch (dbError: any) {
      if (dbError.code === "23505") { // Postgres unique_violation
        throw new Error("You have already applied for this cycle.");
      }
      throw dbError;
    }

    // Only dispatch grading if not a draft
    if (data.status !== "draft") {
      await gradingQueue.add("grade-application", {
        applicationId,
        answers: data,
      }, { jobId: crypto.createHash("sha256").update(`grade:${applicationId}`).digest("hex") });
    }

    return { success: true, applicationId };
  }
}
