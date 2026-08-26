import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { getMockSession, createTestUser, cleanupTestUser } from "./test-utils";
import { db } from "@/lib/db";
import { forms, formFields, formResponses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const authState = vi.hoisted(() => ({ userId: "" }));

vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => new Map()
}));

vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => new Map()
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockImplementation(async () => ({ user: { id: authState.userId, email: "test@college.edu.in", role: "admin", emailVerified: true } }))
    }
  }
}));

vi.mock("@/lib/dal/auth", () => ({
  requireSession: vi.fn().mockImplementation(async () => ({ user: { id: authState.userId, email: "test@college.edu.in", role: "admin", emailVerified: true } })),
  requireAdmin: vi.fn().mockImplementation(async () => ({ user: { id: authState.userId, role: "admin", emailVerified: true } })),
  requireRole: vi.fn().mockImplementation(async () => ({ user: { id: authState.userId, role: "admin", emailVerified: true } })),
  checkEmergencyFreeze: vi.fn(),
  AuthorizationError: class AuthorizationError extends Error {}
}));

describe("Forms DAL Integration Tests", () => {
  let adminId: string;
  let applicantId: string;

  beforeAll(async () => {
    adminId = await createTestUser("admin");
    applicantId = await createTestUser("applicant");
    authState.userId = applicantId;
  });

  afterAll(async () => {
    await db.delete(forms).where(eq(forms.createdBy, adminId));
    await cleanupTestUser(adminId);
    await cleanupTestUser(applicantId);
  });

  it("should block malformed JSON (Zero-day check) due to strict dynamic schema", async () => {
    // 1. Create a form
    const formId = crypto.randomUUID();
    const [form] = await db.insert(forms).values({
      id: formId,
      title: "Strict Form",
      status: "published",
      createdBy: adminId,
      settings: {
        allowExternal: true,
        requireLogin: false,
        allowMultiple: true,
        quotaPerUser: 10,
        quotaPerForm: 1000,
        collegeDomainOnly: false,
      }
    }).returning();

    // 2. Add some fields
    const fieldId = crypto.randomUUID();
    const [field] = await db.insert(formFields).values({
      id: fieldId,
      formId: form.id,
      type: "number", // requires number
      label: "Age",
      required: true,
      order: 1
    }).returning();

    // 3. Attempt to submit malformed data via API handler directly
    const { POST } = await import("@/app/api/forms/[id]/responses/route");
    
    // Create a mock request
    const req = new Request(`http://localhost:3000/api/forms/${form.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          [field.id]: "twenty-two", // String instead of number -> injection/malformed
        }
      })
    });

    const res = await POST(req as any, { params: Promise.resolve({ id: form.id }) });
    expect(res.status).toBe(400); // Should fail validation

    const json = await res.json();
    expect(json.error).toBe("Validation failed");

    // Attempt valid data
    const reqValid = new Request(`http://localhost:3000/api/forms/${form.id}/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          [field.id]: 22,
        }
      })
    });

    const resValid = await POST(reqValid as any, { params: Promise.resolve({ id: form.id }) });
    expect(resValid.status).toBe(200);
    const jsonValid = await resValid.json();
    expect(jsonValid.success).toBe(true);
  });
});
