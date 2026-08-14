import { z } from "zod";

// ─── Application Submission ────────────────────────────────────────────────

export const submitApplicationSchema = z.object({
  applicationCycle: z.string().min(1, "Application cycle is required"),
  answers: z.record(z.string(), z.any()).optional().default({}),
  linkedinUrl: z.string().url("Must be a valid LinkedIn URL").optional().nullable(),
  githubUrl: z.string().url("Must be a valid GitHub URL").optional().nullable(),
  portfolioUrl: z.string().url("Must be a valid URL").optional().nullable(),
  resumeUrl: z.string().url("Must be a valid URL").optional().nullable(),
  skills: z.array(z.string().max(50)).max(20).optional().default([]),
  teamPreference: z.string().max(100).optional().nullable(),
  whyJoin: z.string().min(20, "Please write at least 20 characters").max(2000).optional().nullable(),
  priorExperience: z.string().max(2000).optional().nullable(),
  availability: z.string().max(200).optional().nullable(),
  /** draft=true saves without triggering AI grading */
  isDraft: z.boolean().default(false),
});

export type SubmitApplicationInput = z.infer<typeof submitApplicationSchema>;

// ─── Application Status Transition ────────────────────────────────────────

/**
 * Valid state machine transitions:
 *   applied       → ai_graded | needs_manual_review | rejected | interviewing
 *   ai_graded     → needs_manual_review | interviewing | rejected
 *   needs_manual_review → interviewing | rejected
 *   interviewing  → accepted | rejected
 *   accepted      → (terminal)
 *   rejected      → (terminal)
 *   draft         → applied
 */
export const APPLICATION_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ["applied"],
  applied: ["ai_graded", "needs_manual_review", "rejected", "interviewing"],
  ai_graded: ["needs_manual_review", "interviewing", "rejected"],
  needs_manual_review: ["interviewing", "rejected"],
  interviewing: ["accepted", "rejected"],
  accepted: [],
  rejected: [],
} as const;

export const applicationStatusSchema = z.object({
  status: z.enum([
    "draft",
    "applied",
    "ai_graded",
    "needs_manual_review",
    "interviewing",
    "accepted",
    "rejected",
  ]),
  reason: z.string().max(1000).optional(),
  /** For interviewing state: link to the meeting */
  meetingLink: z.string().url().optional().nullable(),
  scheduledAt: z.string().datetime().optional().nullable(),
  interviewerId: z.string().optional().nullable(),
});

export type ApplicationStatusInput = z.infer<typeof applicationStatusSchema>;

// ─── Application Review (internal notes) ──────────────────────────────────

export const applicationReviewSchema = z.object({
  action: z.enum(["approved", "rejected", "needs_info"]),
  reasonCode: z.string().max(50).optional().nullable(),
  reasonNote: z.string().max(2000).optional().nullable(),
});

export type ApplicationReviewInput = z.infer<typeof applicationReviewSchema>;

// ─── Interview Scheduling ──────────────────────────────────────────────────

export const scheduleInterviewSchema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.string().datetime("Invalid datetime"),
  meetingLink: z.string().url("Must be a valid URL").optional().nullable(),
  interviewerId: z.string().min(1, "Interviewer is required"),
});

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
