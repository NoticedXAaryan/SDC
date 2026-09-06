import { describe, expect, it } from "vitest";

import {
  createCertTemplateSchema,
  issueAdhocCertificatesSchema,
  issueCertificatesSchema,
  revokeCertificateSchema,
} from "@/lib/validators/certificate";

describe("certificate command validation", () => {
  it("accepts event issuance with an explicit template", () => {
    expect(issueCertificatesSchema.parse({ eventId: "event-1", templateId: "template-1" })).toEqual({
      eventId: "event-1",
      templateId: "template-1",
    });
  });

  it("caps bulk issuance and validates idempotency keys", () => {
    expect(() => issueAdhocCertificatesSchema.parse({
      templateId: "template-1",
      userIds: Array.from({ length: 501 }, (_, index) => `user-${index}`),
    })).toThrow();
    expect(() => issueAdhocCertificatesSchema.parse({
      templateId: "template-1",
      userIds: ["user-1"],
      idempotencyKey: "x".repeat(129),
    })).toThrow();
  });

  it("requires a usable PDF template and pdfme page schemas", () => {
    expect(createCertTemplateSchema.parse({
      name: "Completion",
      backgroundUrl: "/uploads/certificate.pdf",
    }).fields).toEqual([[]]);

    expect(() => createCertTemplateSchema.parse({
      name: "Completion",
      backgroundUrl: "not-a-url",
      fields: [],
    })).toThrow();
  });

  it("requires a meaningful revocation reason", () => {
    expect(() => revokeCertificateSchema.parse({ certificateId: "cert-1", reason: "bad" })).toThrow();
    expect(revokeCertificateSchema.parse({ certificateId: "cert-1", reason: "Issued in error" })).toBeTruthy();
  });
});
