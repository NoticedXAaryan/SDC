import { describe, expect, it } from "vitest";

import { createTransactionalEmailJob } from "@/lib/queues/email";
import { APPLICATION_STATUS_TRANSITIONS, applicationStatusSchema } from "@/lib/validators/application";
import { reviewProjectSchema } from "@/lib/validators/projects";
import { canTransitionContent } from "@/lib/workflows/content";
import { canTransitionProcurement } from "@/lib/workflows/procurement";

describe("workflow contracts", () => {
  it("wraps transactional email data in the shape consumed by the worker", () => {
    expect(createTransactionalEmailJob({
      to: "member@example.com",
      subject: "Interview scheduled",
      html: "<p>See you soon.</p>",
    })).toEqual({
      type: "send_email",
      payload: {
        to: "member@example.com",
        subject: "Interview scheduled",
        html: "<p>See you soon.</p>",
      },
    });
  });

  it("requires the recruitment pipeline to pass through an interview before acceptance", () => {
    expect(APPLICATION_STATUS_TRANSITIONS.applied).not.toContain("accepted");
    expect(APPLICATION_STATUS_TRANSITIONS.ai_graded).not.toContain("accepted");
    expect(APPLICATION_STATUS_TRANSITIONS.interviewing).toContain("accepted");
  });

  it("accepts structured rejection feedback at the API boundary", () => {
    expect(applicationStatusSchema.parse({
      status: "rejected",
      reasonCode: "SKILL_MISMATCH",
      reasonNote: "The current intake needs a different skill mix.",
    })).toMatchObject({
      status: "rejected",
      reasonCode: "SKILL_MISMATCH",
    });
  });

  it("requires quote collection before procurement approval", () => {
    expect(canTransitionProcurement("draft", "approved")).toBe(false);
    expect(canTransitionProcurement("draft", "pending_quotes")).toBe(true);
    expect(canTransitionProcurement("pending_quotes", "approval")).toBe(true);
  });

  it("prevents publishing content before review and scheduling", () => {
    expect(canTransitionContent("drafting", "published")).toBe(false);
    expect(canTransitionContent("drafting", "review")).toBe(true);
    expect(canTransitionContent("scheduled", "published")).toBe(true);
  });

  it("requires actionable feedback when a project is rejected", () => {
    expect(reviewProjectSchema.safeParse({ status: "rejected" }).success).toBe(false);
    expect(reviewProjectSchema.safeParse({ status: "rejected", reasonCode: "INCOMPLETE", reasonNote: "Add setup instructions." }).success).toBe(true);
  });
});
