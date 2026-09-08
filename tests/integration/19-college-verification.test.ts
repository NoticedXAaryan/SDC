import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collegeIdentities, user } from "@/lib/db/schema";
import { createTestUser, cleanupTestUser } from "./test-utils";
import { isCollegeEmail } from "@/lib/college-policy";
const { mail } = vi.hoisted(() => ({ mail: [] as { to: string; html: string }[] }));
vi.mock("@/lib/services/mailer", () => ({ Mailer: { sendEmail: async (message: { to: string; html: string }) => { mail.push(message); return { id: "local-test" }; } } }));
import { collegeStatus, requireCollegeVerification, sendCollegeCode, verifyCollegeCode } from "@/lib/services/college-verification";

describe("College email ownership", () => {
  const ids: string[] = [];
  const email = `college-${crypto.randomUUID()}@goa.paruluniversity.ac.in`;
  const details = { email, enrollmentNumber: "TEST-2026-001", collegeName: "Parul University, Goa" };
  const code = () => mail.at(-1)!.html.match(/<strong>(\d{6})<\/strong>/)![1];
  beforeAll(async () => { for (let index = 0; index < 5; index++) ids.push(await createTestUser("outsider")); });
  afterAll(async () => { for (const id of ids) await cleanupTestUser(id); });
  it("matches only the exact student domain", () => {
    expect(isCollegeEmail(" Student@GOA.PARULUNIVERSITY.AC.IN ")).toBe(true);
    for (const value of ["a@paruluniversity.ac.in", "a@goa.paruluniversity.ac.in.evil.test", "a@evilgoa.paruluniversity.ac.in", "a@gmail.com"]) expect(isCollegeEmail(value)).toBe(false);
  });
  it("requires verified ownership and never exposes a verification secret in status", async () => {
    await expect(requireCollegeVerification(ids[0])).rejects.toThrow("Verify your college email");
    await sendCollegeCode(ids[0], details);
    expect(await collegeStatus(ids[0])).toEqual({ verified: false, email: null, pendingEmail: email });
    const [record] = await db.select().from(collegeIdentities).where(eq(collegeIdentities.userId, ids[0]));
    expect(record.codeHash).not.toContain(code());
    await expect(sendCollegeCode(ids[0], details)).rejects.toThrow("one minute");
    await verifyCollegeCode(ids[0], code());
    expect((await collegeStatus(ids[0])).verified).toBe(true);
    await expect(requireCollegeVerification(ids[0])).resolves.toBeUndefined();
  });
  it("prevents a college address from enrolling multiple accounts", async () => {
    await sendCollegeCode(ids[1], details);
    await expect(verifyCollegeCode(ids[1], code())).rejects.toThrow("cannot be linked");
    expect((await collegeStatus(ids[1])).verified).toBe(false);
  });
  it("persists incorrect attempts, locks after five, and rejects expired codes", async () => {
    await sendCollegeCode(ids[2], { ...details, email: `attempts-${ids[2]}@goa.paruluniversity.ac.in` });
    const correct = code();
    const wrong = correct === "123456" ? "654321" : "123456";
    for (let index = 0; index < 5; index++) await expect(verifyCollegeCode(ids[2], wrong)).rejects.toThrow("isn't correct");
    await expect(verifyCollegeCode(ids[2], correct)).rejects.toThrow("Too many incorrect");
    await db.update(collegeIdentities).set({ attempts: 0, expiresAt: new Date(Date.now() - 1000) }).where(eq(collegeIdentities.userId, ids[2]));
    await expect(verifyCollegeCode(ids[2], correct)).rejects.toThrow("expired");
  });
  it("reuses an already verified college signup address without a second code", async () => {
    const primary = `primary-${ids[3]}@goa.paruluniversity.ac.in`;
    await db.update(user).set({ email: primary, emailVerified: false }).where(eq(user.id, ids[3]));
    expect((await collegeStatus(ids[3])).verified).toBe(false);
    await expect(requireCollegeVerification(ids[3])).rejects.toThrow("Verify");
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, ids[3]));
    expect((await collegeStatus(ids[3])).verified).toBe(true);
    await requireCollegeVerification(ids[3]);
    const [identity] = await db.select().from(collegeIdentities).where(eq(collegeIdentities.userId, ids[3]));
    expect(identity.collegeEmail).toBe(primary);
  });
  it("keeps the hourly resend limit even when the minute cooldown has passed", async () => {
    await sendCollegeCode(ids[4], { ...details, email: `limit-${ids[4]}@goa.paruluniversity.ac.in` });
    await db.update(collegeIdentities).set({ lastSentAt: new Date(Date.now() - 61_000), sendCount: 5 }).where(eq(collegeIdentities.userId, ids[4]));
    await expect(sendCollegeCode(ids[4], details)).rejects.toThrow("five codes");
  });
});
