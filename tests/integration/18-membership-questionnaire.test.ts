import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, applicationDocuments, formTemplates } from "@/lib/db/schema";
import { createTestUser, cleanupTestUser, getMockSession } from "./test-utils";
const { activeSession } = vi.hoisted(() => ({ activeSession: { current: null as any } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: async () => activeSession.current } } }));
vi.mock("@/lib/rate-limit", () => ({ getClientIp: () => "127.0.0.1", checkRateLimit: async () => ({ success: true }) }));
vi.mock("@/lib/turnstile", () => ({ validateTurnstile: async () => true }));

describe("Private questionnaire documents and draft submission", () => {
  const ids: string[] = [];
  const cycle = "questionnaire-" + crypto.randomUUID();
  let resume: { id: string; name: string; size: number };
  beforeAll(async () => {
    for (const role of ["outsider", "outsider", "admin"]) ids.push(await createTestUser(role));
    await db.insert(formTemplates).values({ cycleName: cycle, isActive: true, fields: [{ id: "why", label: "Why join?", type: "textarea", required: true }, { id: "resume", label: "Résumé", type: "file", required: true }] });
  });
  afterAll(async () => {
    await db.delete(applications).where(inArray(applications.userId, ids));
    await db.delete(formTemplates).where(eq(formTemplates.cycleName, cycle));
    for (const id of ids) await cleanupTestUser(id);
  });
  async function upload(content = "%PDF-1.4\n%%EOF", name = "resume.pdf") {
    const { POST } = await import("@/app/api/applications/resume/route");
    const data = new FormData(); data.set("file", new File([content], name, { type: "application/pdf" })); data.set("cycle", cycle);
    return POST(new NextRequest("http://localhost/api/applications/resume", { method: "POST", body: data }), {});
  }
  async function download() {
    const { GET } = await import("@/app/api/applications/resume/[id]/route");
    return GET(new NextRequest(`http://localhost/api/applications/resume/${resume.id}`), { params: Promise.resolve({ id: resume.id }) });
  }
  async function submit(answers: Record<string, unknown>, status = "applied") {
    const { POST } = await import("@/app/api/applications/route");
    return POST(new NextRequest("http://localhost/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answers, status, applicationCycle: cycle }) }), {});
  }
  it("requires verification and validates PDF contents and the size limit", async () => {
    activeSession.current = null;
    expect((await upload()).status).toBe(401);
    activeSession.current = getMockSession(ids[0], "outsider");
    activeSession.current.user.emailVerified = false;
    expect((await upload()).status).toBe(403);
    activeSession.current.user.emailVerified = true;
    expect((await upload("not a PDF")).status).toBe(400);
    expect((await upload("x".repeat(2 * 1024 * 1024 + 1))).status).toBe(400);
    const response = await upload(); expect(response.status).toBe(200); resume = await response.json();
    expect(Object.keys(resume).sort()).toEqual(["id", "name", "size"]);
  });
  it("keeps uploaded files private until their owner submits them", async () => {
    expect((await download()).status).toBe(200);
    activeSession.current = getMockSession(ids[1], "outsider"); expect((await download()).status).toBe(404);
    activeSession.current = getMockSession(ids[2], "admin"); expect((await download()).status).toBe(404);
    activeSession.current = null; expect((await download()).status).toBe(401);
  });
  it("rejects a forged document attachment from another account", async () => {
    activeSession.current = getMockSession(ids[1], "outsider");
    const response = await submit({ why: "I want to learn", resume });
    expect(response.status).toBe(400);
    expect(await db.select().from(applications).where(eq(applications.userId, ids[1]))).toHaveLength(0);
  });
  it("saves incomplete drafts, validates final answers, and makes submission immutable but retryable", async () => {
    activeSession.current = getMockSession(ids[0], "outsider");
    expect((await submit({ resume }, "draft")).status).toBe(200);
    expect((await submit({ resume })).status).toBe(400);
    const answers = { why: "I want to learn with other students", resume };
    const first = await submit(answers); expect(first.status).toBe(200);
    const retry = await submit(answers); expect(retry.status).toBe(200);
    expect(await retry.json()).toEqual(await first.json());
    expect((await submit({ ...answers, why: "Changed after review started" })).status).toBe(400);
    expect((await upload()).status).toBe(400);
    const [document] = await db.select({ name: applicationDocuments.name }).from(applicationDocuments).where(eq(applicationDocuments.id, resume.id));
    expect(document.name).toBe("resume.pdf");
  });
  it("allows reviewer downloads after submission but checks current database permissions", async () => {
    activeSession.current = getMockSession(ids[2], "admin");
    const response = await download(); expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Content-Disposition")).toContain("attachment");
    activeSession.current = getMockSession(ids[1], "admin"); // Stale privileged cookie, actual outsider.
    expect((await download()).status).toBe(404);
  });
});
