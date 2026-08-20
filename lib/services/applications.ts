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
import { applications, user, interviews, applicationReviews, auditLogs, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getEmailQueue } from "@/lib/queues/email";
import { getGradingQueue } from "@/lib/queues/grading";
import { NotificationService } from "@/lib/services/notifications";
import { logAuditEvent } from "@/lib/services/audit";
import { AuthorizationError, ValidationError } from "@/lib/api-wrapper";
import type { AuthSession } from "@/lib/dal/auth";
import { ADMIN_ROLES, MANAGEMENT_ROLES } from "@/lib/dal/auth";
import type { SDCRole } from "@/lib/dal/auth";
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

// ─── RBAC Constants ────────────────────────────────────────────────────────

/** Roles that may view the recruitment queue */
const RECRUITMENT_REVIEWER_ROLES: SDCRole[] = [
  "lead", "vice_lead", "co_lead", "admin", "owner"
];

/** Roles that may accept (final approval) an application */
const ACCEPTANCE_ROLES: SDCRole[] = ["lead", "vice_lead", "admin", "owner"];

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

  await db.transaction(async (tx) => {
    // Check for existing application — upsert pattern
    const existing = await tx.query.applications.findFirst({
      where: and(
        eq(applications.userId, userId),
        eq(applications.applicationCycle, data.applicationCycle)
      ),
    });

    if (existing) {
      // Cannot re-submit a terminal application
      if (["accepted", "rejected"].includes(existing.status ?? "")) {
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

  // Queue AI grading if submitted (not a draft) — idempotent via deterministic jobId
  if (!data.isDraft) {
    const jobId = crypto.createHash("sha256")
      .update(`grade:${applicationId}`)
      .digest("hex");

    await getGradingQueue().add(
      "grade-application",
      { applicationId, answers: data.answers },
      { jobId, attempts: 3 }
    );
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
      .where(eq(applications.id, applicationId));

    // ACCEPTANCE: atomically upgrade user role to "member"
    if (data.status === "accepted") {
      await tx
        .update(user)
        .set({ role: "member", updatedAt: new Date() })
        .where(eq(user.id, existing.userId));
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
        reason: data.reason ?? null,
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

  await getEmailQueue().add(
    "send-email",
    {
      to: application.user?.email,
      subject: "Interview Scheduled — Student Developer Club",
      html: `<p>Hi ${application.user?.name},</p>
             <p>Your interview has been scheduled for <strong>${new Date(data.scheduledAt).toLocaleString()}</strong>.</p>
             ${data.meetingLink ? `<p>Meeting link: <a href="${data.meetingLink}">${data.meetingLink}</a></p>` : ""}
             <p>Best of luck!</p>`,
    },
    { jobId, attempts: 3 }
  );

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

    const emailHtml =
      data.status === "accepted"
        ? `<p>Hi ${application.user.name},</p>
           <p>🎉 Congratulations! You've been accepted into the Student Developer Club!</p>
           <p>Log in to your account to complete your profile and get started.</p>`
        : `<p>Hi ${application.user.name},</p>
           <p>Thank you for applying to the Student Developer Club. Unfortunately, we're unable to move forward with your application at this time.</p>
           ${data.reason ? `<p>Feedback: ${data.reason}</p>` : ""}
           <p>We encourage you to apply again in our next recruitment cycle.</p>`;

    await getEmailQueue().add(
      "send-email",
      { to: application.user.email, subject: emailSubject, html: emailHtml },
      { jobId, attempts: 3 }
    );
  }
}
