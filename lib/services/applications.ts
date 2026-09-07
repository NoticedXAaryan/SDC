/**
 * ApplicationService — SOC-compliant applicant→member workflow.
 *
 * Every command:
 *   1. Validates input via Zod at the boundary
 *   2. Checks RBAC at service/DAL layer (not just route wrapper)
 *   3. Wraps mutation + audit record in a single transaction
 *   4. Is idempotent (DB unique constraints + deterministic queue jobIds)
 *
 * Workflow states (defined in validators/application.ts):
 *   draft → applied → ai_graded → needs_manual_review → interviewing → accepted | rejected
 */
import { db } from "@/lib/db";
import { applications, applicationDocuments, user, interviews, applicationReviews, auditLogs, notifications } from "@/lib/db/schema";
import { resumeAnswerSchema } from "@/lib/recruitment-form";
import { eq, and, sql, inArray } from "drizzle-orm";
import { createTransactionalEmailJob, getEmailQueue } from "@/lib/queues/email";
import { getGradingQueue } from "@/lib/queues/grading";
import { NotificationService } from "@/lib/services/notifications";
import { logAuditEvent } from "@/lib/services/audit";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { ADMIN_ROLES, MANAGEMENT_ROLES } from "@/lib/dal/auth";
import type { SDCRole } from "@/lib/dal/auth";
import { escapeHtml, toSafeHttpUrl } from "@/lib/email/html";
import {
  submitApplicationSchema,
  applicationStatusSchema,
  scheduleInterviewSchema,
  applicationReviewSchema,
  APPLICATION_STATUS_TRANSITIONS,
  type SubmitApplicationInput,
  type ApplicationStatusInput,
  type ScheduleInterviewInput,
  type ApplicationReviewInput,
} from "@/lib/validators/application";
import crypto from "crypto";
import { isDeepStrictEqual } from "node:util";

// ─── RBAC Constants ────────────────────────────────────────────────────────

/** Roles that may view the recruitment queue */
export const RECRUITMENT_REVIEWER_ROLES: SDCRole[] = [
  "lead", "vice_lead", "co_lead", "admin", "owner"
];

/** Roles that may accept (final approval) an application */
export const ACCEPTANCE_ROLES: SDCRole[] = ["lead", "vice_lead", "admin", "owner"];

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ApplicationCommandResult {
  success: true;
  applicationId: string;
}

export interface ApplicationStatusResult {
  success: true;
  applicationId: string;
  previousStatus: string;
  newStatus: string;
}

// ─── Submit / Draft Application ─────────────────────────────────────────────

/**
 * Submits or saves a draft application for the authenticated user.
 * Idempotent: upserts by (userId, applicationCycle) unique constraint.
 */
export async function submitApplication(
  session: AuthSession,
  rawData: unknown
): Promise<ApplicationCommandResult> {
  const data = submitApplicationSchema.parse(rawData);
  if (!session.user.emailVerified) throw new AuthorizationError("Verify your email before applying.");
  const userId = session.user.id;
  const targetStatus = data.isDraft ? "draft" : "applied";

  // Applicants can only submit for themselves; management can submit on behalf of
  // (but that would be a different command; here only self-submit is allowed)

  const payload = {
    linkedinUrl: data.linkedinUrl ?? null,
    githubUrl: data.githubUrl ?? null,
    portfolioUrl: data.portfolioUrl ?? null,
    resumeUrl: data.resumeUrl ?? null,
    skills: data.skills ?? [],
    teamPreference: data.teamPreference ?? null,
    whyJoin: data.whyJoin ?? null,
    priorExperience: data.priorExperience ?? null,
    availability: data.availability ?? null,
    answers: data.answers ?? {},
    status: targetStatus as typeof applications.$inferInsert["status"],
    updatedAt: new Date(),
  };

  let applicationId = crypto.randomUUID() as any;
  let alreadySubmitted = false;

  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${user} where id = ${userId} for update`);
    for (const answer of Object.values(data.answers)) {
      const resume = resumeAnswerSchema.safeParse(answer);
      if (!resume.success) continue;
      const [document] = await tx.select({ id: applicationDocuments.id, name: applicationDocuments.name, size: applicationDocuments.size }).from(applicationDocuments)
        .where(and(eq(applicationDocuments.id, resume.data.id), eq(applicationDocuments.userId, userId), eq(applicationDocuments.cycle, data.applicationCycle))).limit(1);
      if (!document || document.name !== resume.data.name || document.size !== resume.data.size) throw new ValidationError("Your résumé changed or is unavailable. Upload it again before continuing.");
    }
    // Check for existing application — upsert pattern
    const existing = await tx.query.applications.findFirst({
      where: and(
        eq(applications.userId, userId),
        eq(applications.applicationCycle, data.applicationCycle)
      ),
    });

    if (existing) {
      if (!data.isDraft && existing.status !== "draft" && isDeepStrictEqual(existing.answers, data.answers)) {
        applicationId = existing.id;
        alreadySubmitted = true;
        return;
      }
      // Cannot re-submit a terminal application
      if (existing.status !== "draft") {
        throw new ValidationError(
          `Cannot modify a ${existing.status} application.`
        );
      }
      applicationId = existing.id as any;
      await tx
        .update(applications)
        .set(payload)
        .where(eq(applications.id, existing.id));
    } else {
      await tx.insert(applications).values({
        id: applicationId,
        userId,
        applicationCycle: data.applicationCycle,
        ...payload,
      });
    }

    if (!data.isDraft) {
      await tx.update(user).set({ role: "applicant", updatedAt: new Date() })
        .where(and(eq(user.id, userId), inArray(user.role, ["outsider", "user"])));
    }
    // Write audit record inside the same transaction
    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: userId,
      action: data.isDraft ? "application_draft_saved" : "application_submitted",
      entity: "application",
      entityId: applicationId,
      details: JSON.stringify({
        action: data.isDraft ? "application_draft_saved" : "application_submitted",
        cycle: data.applicationCycle,
      }),
      timestamp: new Date(),
    });
  });

  if (alreadySubmitted) return { success: true, applicationId };

  // Queue AI grading if submitted (not a draft) — idempotent via deterministic jobId
  if (!data.isDraft) {
    const jobId = crypto.createHash("sha256")
      .update(`grade:${applicationId}`)
      .digest("hex");

    try {
      await getGradingQueue().add(
        "grade-application",
        { applicationId, answers: data.answers },
        { jobId, attempts: 3 }
      );
    } catch (error) {
      console.error("[ApplicationService] Grading queue unavailable; routing to manual review", error);
      await db.update(applications)
        .set({ status: "needs_manual_review", updatedAt: new Date() })
        .where(eq(applications.id, applicationId));
    }
  }

  return { success: true, applicationId };
}

// ─── Update Application Status (reviewer action) ───────────────────────────

/**
 * Advances an application through the state machine.
 *
 * Rules enforced here (not just in the route):
 *   - Only RECRUITMENT_REVIEWER_ROLES may call this
 *   - Final acceptance requires ACCEPTANCE_ROLES
 *   - "accepted" transition is atomic: writes status, upgrades user.role to "member",
 *     and writes audit log — all in one transaction, or all roll back
 */
export async function updateApplicationStatus(
  session: AuthSession,
  applicationId: string,
  rawData: unknown
): Promise<ApplicationStatusResult> {
  const data = applicationStatusSchema.parse(rawData);
  const actorRole = session.user.role as SDCRole;

  // RBAC check at service layer
  if (!RECRUITMENT_REVIEWER_ROLES.includes(actorRole)) {
    throw new AuthorizationError(
      "Only leads and above may update application status."
    );
  }
  if (data.status === "accepted" && !ACCEPTANCE_ROLES.includes(actorRole)) {
    throw new AuthorizationError(
      "Only leads and admins may accept applications."
    );
  }
  if (data.status === "rejected" && !data.reasonCode) {
    throw new ValidationError("Choose a rejection reason before closing an application.");
  }

  // Fetch application
  const existing = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
    with: { user: true },
  });
  if (!existing) throw new ValidationError("Application not found.");

  const previousStatus = existing.status ?? "applied";

  // State machine guard
  const allowedNext = APPLICATION_STATUS_TRANSITIONS[previousStatus] ?? [];
  if (!allowedNext.includes(data.status)) {
    throw new ValidationError(
      `Cannot transition application from '${previousStatus}' to '${data.status}'.`
    );
  }

  // Atomic transaction: status + potential role upgrade + audit
  await db.transaction(async (tx) => {
    await tx
      .update(applications)
      .set({
        status: data.status as typeof applications.$inferInsert["status"],
        updatedAt: new Date(),
      })
      .where(and(eq(applications.id, applicationId), eq(applications.status, previousStatus as NonNullable<typeof applications.$inferSelect["status"]>)))
      .returning({ id: applications.id }).then(rows => {
        if (!rows.length) throw new ValidationError("This application changed while you were reviewing it. Refresh and try again.");
      });

    // ACCEPTANCE: atomically upgrade user role to "member"
    if (data.status === "accepted") {
      await tx
        .update(user)
        .set({ role: "member", membershipWelcomeSeen: false, updatedAt: new Date() })
        .where(and(eq(user.id, existing.userId), inArray(user.role, ["user", "outsider", "applicant"])));
    }

    if (["accepted", "rejected"].includes(data.status)) {
      await tx.insert(applicationReviews).values({
        id: crypto.randomUUID(),
        applicationId,
        reviewerId: session.user.id,
        action: data.status === "accepted" ? "approved" : "rejected",
        reasonCode: data.reasonCode ?? null,
        reasonNote: data.reasonNote ?? data.reason ?? null,
      });
    }

    // Write audit log within the same transaction for causality guarantee
    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: data.status === "accepted" ? "application_accepted" : "application_status_changed",
      entity: "application",
      entityId: applicationId,
      details: JSON.stringify({
        action: "application_status_changed",
        applicationId,
        previousStatus,
        newStatus: data.status,
        reasonCode: data.reasonCode ?? null,
        reason: data.reasonNote ?? data.reason ?? null,
        actorId: session.user.id,
      }),
      timestamp: new Date(),
    });
  });

  // Fire-and-forget notifications and queues outside the DB transaction
  _dispatchStatusSideEffects(session, existing, data, applicationId).catch(
    (err) => console.error("[ApplicationService] Side-effect error:", err)
  );

  return {
    success: true,
    applicationId,
    previousStatus,
    newStatus: data.status,
  };
}

// ─── Schedule Interview ────────────────────────────────────────────────────

/**
 * Creates an interview record and sends a notification.
 * Idempotent: uses a unique (applicationId, interviewerId) upsert pattern.
 */
export async function scheduleInterview(
  session: AuthSession,
  rawData: unknown
): Promise<{ success: true; interviewId: string }> {
  const data = scheduleInterviewSchema.parse(rawData);
  const actorRole = session.user.role as SDCRole;

  if (!RECRUITMENT_REVIEWER_ROLES.includes(actorRole)) {
    throw new AuthorizationError("Only leads and above may schedule interviews.");
  }

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, data.applicationId),
    with: { user: true },
  });
  if (!application) throw new ValidationError("Application not found.");

  const validStatesForInterview = ["applied", "ai_graded", "needs_manual_review", "interviewing"];
  if (!validStatesForInterview.includes(application.status ?? "")) {
    throw new ValidationError(
      `Cannot schedule interview for application in '${application.status}' state.`
    );
  }

  const existingInterview = await db.query.interviews.findFirst({
    where: eq(interviews.applicantId, data.applicationId),
  });
  if (existingInterview) {
    return { success: true, interviewId: existingInterview.id };
  }

  // Verify the interviewer exists
  const [interviewer] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.id, data.interviewerId))
    .limit(1);
  if (!interviewer) throw new ValidationError("Interviewer not found.");

  const interviewId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    // Insert interview record
    await tx.insert(interviews).values({
      id: interviewId,
      applicantId: data.applicationId,
      interviewerId: data.interviewerId,
      scheduledAt: new Date(data.scheduledAt),
      meetingLink: data.meetingLink ?? null,
    });

    // Advance application to interviewing state if not already
    if (application.status !== "interviewing") {
      await tx
        .update(applications)
        .set({ status: "interviewing", updatedAt: new Date() })
        .where(eq(applications.id, data.applicationId));
    }

    // Audit record
    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: "interview_scheduled",
      entity: "application",
      entityId: application.userId,
      details: JSON.stringify({
        action: "interview_scheduled",
        applicationId: data.applicationId,
        interviewId,
        interviewerId: data.interviewerId,
        scheduledAt: data.scheduledAt,
      }),
      timestamp: new Date(),
    });
  });

  // Notify applicant
  const jobId = crypto.createHash("sha256")
    .update(`interview-invite:${interviewId}`)
    .digest("hex");

  try {
    if (!application.user?.email) throw new Error("Applicant email is unavailable");
    const safeApplicantName = escapeHtml(application.user.name || "there");
    const safeMeetingLink = toSafeHttpUrl(data.meetingLink);
    await getEmailQueue().add(
      "send-email",
      createTransactionalEmailJob({
          to: application.user.email,
          subject: "Interview Scheduled — Student Developer Club",
          html: `<p>Hi ${safeApplicantName},</p>
                 <p>Your interview has been scheduled for <strong>${escapeHtml(new Date(data.scheduledAt).toLocaleString())}</strong>.</p>
                 ${safeMeetingLink ? `<p>Meeting link: <a href="${escapeHtml(safeMeetingLink)}">${escapeHtml(safeMeetingLink)}</a></p>` : ""}
                 <p>Best of luck!</p>`,
      }),
      { jobId, attempts: 3 }
    );
  } catch (error) {
    console.error("[ApplicationService] Interview email could not be queued", error);
  }

  return { success: true, interviewId };
}

// ─── Add Review Note ───────────────────────────────────────────────────────

/**
 * Records an internal review decision on an application.
 * Multiple reviewers can each add one review.
 */
export async function addApplicationReview(
  session: AuthSession,
  applicationId: string,
  rawData: unknown
): Promise<{ success: true; reviewId: string }> {
  const data = applicationReviewSchema.parse(rawData);
  const actorRole = session.user.role as SDCRole;

  if (!RECRUITMENT_REVIEWER_ROLES.includes(actorRole)) {
    throw new AuthorizationError("Only leads and above may add reviews.");
  }

  const application = await db.query.applications.findFirst({
    where: eq(applications.id, applicationId),
  });
  if (!application) throw new ValidationError("Application not found.");

  const reviewId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(applicationReviews).values({
      id: reviewId,
      applicationId,
      reviewerId: session.user.id,
      action: data.action,
      reasonCode: data.reasonCode ?? null,
      reasonNote: data.reasonNote ?? null,
    });

    await tx.insert(auditLogs).values({
      id: crypto.randomUUID(),
      actorId: session.user.id,
      action: "application_review_added",
      entity: "application",
      entityId: applicationId,
      details: JSON.stringify({
        action: "application_review_added",
        applicationId,
        reviewId,
        reviewAction: data.action,
        reasonCode: data.reasonCode,
      }),
      timestamp: new Date(),
    });
  });

  return { success: true, reviewId };
}

// ─── Private Helpers ───────────────────────────────────────────────────────

async function _dispatchStatusSideEffects(
  session: AuthSession,
  application: typeof applications.$inferSelect & { user?: typeof user.$inferSelect | null },
  data: ApplicationStatusInput,
  applicationId: string
) {
  const userId = application.userId;

  // In-app notifications
  const notificationMap: Record<string, { title: string; message: string }> = {
    accepted: {
      title: "Application Accepted! 🎉",
      message:
        "Congratulations! Your application to join the Student Developer Club has been accepted. Welcome aboard!",
    },
    rejected: {
      title: "Application Update",
      message:
        "We appreciate your interest but were unable to accept your application at this time. You may re-apply in the next cycle.",
    },
    interviewing: {
      title: "Interview Invitation",
      message:
        "You've been invited for an interview! Check your email for scheduling details.",
    },
    ai_graded: {
      title: "Application Under Review",
      message: "Your application is being reviewed by our team. We'll notify you soon.",
    },
    needs_manual_review: {
      title: "Application Under Review",
      message: "Your application requires additional review. We'll be in touch shortly.",
    },
  };

  const notif = notificationMap[data.status];
  if (notif) {
    await NotificationService.sendInAppNotification({
      userId,
      type: "system",
      title: notif.title,
      message: notif.message,
      link: "/recruitment/apply",
    });
  }

  // Email on accept/reject (add to queue with idempotency)
  if (["accepted", "rejected"].includes(data.status) && application.user?.email) {
    const jobId = crypto.createHash("sha256")
      .update(`app-status-${data.status}:${applicationId}`)
      .digest("hex");

    const emailSubject =
      data.status === "accepted"
        ? "Welcome to SDC! Your Application Was Accepted"
        : "SDC Application Status Update";

    const safeApplicantName = escapeHtml(application.user.name || "there");
    const feedback = data.reasonNote ?? data.reason;
    const emailHtml =
      data.status === "accepted"
        ? `<p>Hi ${safeApplicantName},</p>
           <p>🎉 Congratulations! You've been accepted into the Student Developer Club!</p>
           <p>Log in to your account to complete your profile and get started.</p>`
        : `<p>Hi ${safeApplicantName},</p>
           <p>Thank you for applying to the Student Developer Club. Unfortunately, we're unable to move forward with your application at this time.</p>
           ${feedback ? `<p>Feedback: ${escapeHtml(feedback)}</p>` : ""}
           <p>We encourage you to apply again in our next recruitment cycle.</p>`;

    await getEmailQueue().add(
      "send-email",
      createTransactionalEmailJob({ to: application.user.email, subject: emailSubject, html: emailHtml }),
      { jobId, attempts: 3 }
    );
  }
}
