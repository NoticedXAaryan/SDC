import { expect as baseExpect, test, type APIRequestContext } from "@playwright/test";
import { config } from "dotenv";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import * as schema from "@/lib/db/schema";
import crypto from "node:crypto";

config({ path: ".env.local", quiet: true });
// A fresh development server compiles routes on first use.
const expect = baseExpect.configure({ timeout: 20000 });
// These fixtures touch only their own accounts and form, never reset a database.
function localFixtureDatabase() {
  const url = new URL(process.env.DATABASE_URL || "");
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !["/sdc_dev", "/sdc_test", "/club_test"].includes(url.pathname)) {
    throw new Error("Browser membership fixtures require the local recovery or CI database.");
  }
  const pool = new Pool({ connectionString: url.toString(), max: 2 });
  return { pool, db: drizzle(pool, { schema }) };
}

test("participants apply, admins approve, and membership is welcomed once", async ({ page, playwright }, testInfo) => {
  test.setTimeout(180000);
  const { pool, db } = localFixtureDatabase();
  const ids: string[] = [];
  const cycle = "browser-membership-" + crypto.randomUUID();
  let applicationId: string | undefined;
  const password = "Local-membership-test-123!";
  const testIp = () => "198.51.100." + crypto.randomInt(1, 255);
  // Independent local clients should not share a single IP quota in CI.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": testIp() });
  const admin = await playwright.request.newContext({ baseURL: "http://localhost:3000", extraHTTPHeaders: { "x-forwarded-for": testIp() } });
  async function createAccount(request: APIRequestContext, name: string) {
    const username = "member_" + crypto.randomUUID().replaceAll("-", "").slice(0, 10);
    const email = username + "@example.com";
    const forged = await request.post("/api/auth/sign-up/email", {
      data: { name, email, password, username, role: "owner", onboardingCompleted: true, membershipWelcomeSeen: true },
    });
    expect(forged.status()).toBe(400);
    const response = await request.post("/api/auth/sign-up/email", { data: { name, email, password, username } });
    expect(response.ok(), response.ok() ? "" : await response.text()).toBe(true);
    const body = await response.json();
    ids.push(body.user.id);
    expect(body.user).toMatchObject({ role: "outsider", emailVerified: false, onboardingCompleted: false, username });
    return { id: body.user.id as string, username, email };
  }
  try {
    const participant = await createAccount(page.request, "Membership Test Participant");
    const leader = await createAccount(admin, "Membership Test Admin");
    // Email delivery is covered by account-journey. This fixture starts at a verified account.
    await db.update(schema.user).set({ emailVerified: true }).where(eq(schema.user.id, participant.id));
    await db.update(schema.user).set({ emailVerified: true, role: "admin", onboardingCompleted: true }).where(eq(schema.user.id, leader.id));
    await page.request.get("/api/auth/get-session?disableCookieCache=true");
    await admin.get("/api/auth/get-session?disableCookieCache=true");
    const alternateGrant = await admin.post("/api/auth/admin/set-role", { headers: { Origin: "http://localhost:3000" }, data: { userId: participant.id, role: "owner" } });
    expect(alternateGrant.status()).toBe(404);
    const bypass = await page.request.post("/api/auth/update-user", { headers: { Origin: "http://localhost:3000" }, data: { username: participant.username + "x" } });
    expect(bypass.status()).toBe(400);
    const escalation = await page.request.post("/api/onboarding/approve", { data: { userId: participant.id, approve: true } });
    expect(escalation.status()).toBe(403);
    await db.insert(schema.formTemplates).values({ cycleName: cycle, isActive: true, fields: [
      { id: "fullName", label: "Your full name", type: "text", required: true },
      { id: "why", label: "Why would you like to join?", type: "textarea", required: true },
      { id: "teamPreference", label: "Team interest", type: "select", required: true, options: ["Development", "Design"] },
      { id: "resume", label: "Add your résumé", type: "file", required: true },
    ] });
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/setup$/);
    await page.getByRole("button", { name: "Apply for membership" }).click();
    await expect(page).toHaveURL(/\/recruitment\/apply$/);
    await expect(page.getByText("4 questions, one at a time")).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("questionnaire-intro.png"), fullPage: true });
    await page.getByRole("button", { name: "I'm ready" }).click();
    await expect(page.getByRole("textbox", { name: "Your full name" })).toHaveValue("Membership Test Participant");
    await expect(page.getByLabel("Why would you like to join?")).toHaveCount(0);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.locator("#application-error")).toContainText("Complete");
    await page.getByLabel("Why would you like to join?").fill("I would like to build useful projects and learn with other students.");
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByLabel("Why would you like to join?")).toContainText("I would like");
    await page.screenshot({ path: testInfo.outputPath("questionnaire-question.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByLabel("Team interest", { exact: true }).selectOption("Development");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Review my answers" }).click();
    await expect(page.locator("#application-error")).toContainText("Complete");
    await page.getByLabel("Add your résumé").setInputFiles({ name: "resume.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF") });
    await expect(page.getByText("Attached:", { exact: false })).toBeVisible();
    const resumeLink = await page.getByRole("link", { name: "Download résumé", exact: true }).getAttribute("href");
    expect((await admin.get(resumeLink!)).status()).toBe(404);
    expect((await page.request.get(resumeLink!)).status()).toBe(200);
    await page.getByRole("button", { name: "Save and exit" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    const [draft] = await db.select().from(schema.applications).where(eq(schema.applications.userId, participant.id));
    applicationId = draft.id;
    expect(draft.status).toBe("draft");
    await expect(page.locator(".club-topbar .club-membership-badge")).toHaveText("Participant");
    await page.goto("/recruitment/apply");
    await page.getByRole("button", { name: "Continue my application" }).click();
    for (let index = 0; index < 3; index++) await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByText("Attached:", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Review my answers" }).click();
    await page.getByRole("button", { name: "Edit: Team interest", exact: true }).click();
    await page.getByLabel("Team interest", { exact: true }).selectOption("Design");
    await page.getByRole("button", { name: "Back to review" }).click();
    await expect(page.locator(".club-answer-review")).toContainText("Design");
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("heading", { name: "Your application is with the club." })).toBeVisible();
    expect((await admin.get(resumeLink!)).status()).toBe(200);
    await page.getByRole("link", { name: "Track my application" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.locator(".club-topbar .club-membership-badge")).toHaveText("Applicant");
    await expect(page.getByRole("heading", { name: "Your membership application" })).toBeVisible();
    await page.goto("/recruitment/interviews");
    await expect(page).toHaveURL(/\/dashboard$/);
    const [application] = await db.select().from(schema.applications).where(eq(schema.applications.userId, participant.id));
    applicationId = application.id;
    expect(application.answers).toMatchObject({ teamPreference: "Design", fullName: "Membership Test Participant", resume: { name: "resume.pdf" } });
    const reviewPage = await admin.get(`/applications/${applicationId}`);
    expect(await reviewPage.text()).toContain("Download résumé");
    for (const status of ["interviewing", "accepted"]) {
      const response = await admin.patch(`/api/applications/${applicationId}/status`, { data: { status } });
      expect(response.ok(), await response.text()).toBe(true);
    }
    await page.reload();
    await expect(page.locator(".club-topbar .club-membership-badge")).toHaveText("Member");
    await expect(page.getByRole("status", { name: "" }).filter({ hasText: "Congratulations! You are a member now." })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("membership-approved.png"), fullPage: true });
    await page.getByRole("button", { name: "Got it", exact: true }).click();
    await expect(page.getByText("Congratulations! You are a member now.", { exact: true })).toHaveCount(0);
    await page.reload();
    await expect(page.getByText("Congratulations! You are a member now.", { exact: true })).toHaveCount(0);
    await page.goto("/settings");
    await expect(page.getByLabel("Username", { exact: true })).toHaveValue(participant.username);
    await page.getByLabel("Username", { exact: true }).fill(participant.username + "x");
    await page.getByRole("button", { name: "Save username" }).click();
    await expect(page.locator("#username").getByRole("alert")).toContainText("30 days");
    await page.screenshot({ path: testInfo.outputPath("settings.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally {
    if (applicationId) {
      await db.delete(schema.applicationReviews).where(eq(schema.applicationReviews.applicationId, applicationId));
      await db.delete(schema.applications).where(eq(schema.applications.id, applicationId));
    }
    await db.delete(schema.formTemplates).where(eq(schema.formTemplates.cycleName, cycle));
    if (ids.length) {
      await db.delete(schema.auditLogs).where(inArray(schema.auditLogs.actorId, ids));
      await db.delete(schema.user).where(inArray(schema.user.id, ids));
    }
    await admin.dispose();
    await pool.end();
  }
});

test("signup rejects a filled bot trap and reserved usernames", async ({ request }) => {
  const data = { name: "Bot protection test", email: `bot-${crypto.randomUUID()}@example.com`, password: "Local-bot-test-123!", username: "admin" };
  const trapped = await request.post("/api/auth/sign-up/email", { data: { ...data, website: "spam.example" } });
  expect(trapped.status()).toBe(400);
  const reserved = await request.post("/api/auth/sign-up/email", { data });
  expect(reserved.status()).toBe(400);
  const enumeration = await request.post("/api/auth/is-username-available", { data: { username: "admin" } });
  expect(enumeration.status()).toBe(404);
});
