import { expect, test, type APIRequestContext } from "@playwright/test";
import crypto from "node:crypto";

// Real local auth, PostgreSQL and Mailpit. No mocked session or verification flag.
const mailbox = "http://127.0.0.1:58025";
async function emailLink(request: APIRequestContext, email: string, subject: string, minimum = 1) {
  let messages: { ID: string; Subject: string }[] = [];
  await expect.poll(async () => {
    const response = await request.get(`${mailbox}/api/v1/search`, { params: { query: `to:${email}` } });
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    messages = body.messages.filter((message: { Subject: string }) => message.Subject.startsWith(subject));
    return messages.length;
  }, { timeout: 15000 }).toBeGreaterThanOrEqual(minimum);
  const response = await request.get(`${mailbox}/api/v1/message/${messages[0].ID}`);
  const message = await response.json();
  const href = String(message.HTML).match(/href="([^"]+)"/)?.[1].replaceAll("&amp;", "&");
  expect(href).toBeDefined();
  expect(new URL(href!).origin).toBe("http://localhost:3000");
  return href!;
}

test("signup, verification, onboarding and password recovery work together", async ({ page, request }, testInfo) => {
  test.setTimeout(120000);
  const email = `journey-${crypto.randomUUID()}@example.com`;
  const password = "Initial-local-password-123!";
  const newPassword = "New-local-password-456!";

  await page.goto("/register?callbackUrl=%2Fevents");
  const username = "journey_" + crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  await page.getByLabel("Username", { exact: true }).fill(username);
  await page.getByLabel("Full name", { exact: true }).fill("Journey Test Member");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Verify your email", exact: true })).toBeVisible();
  const before = await (await page.request.get("/api/auth/get-session", { params: { disableCookieCache: true } })).json();
  expect(before.user).toMatchObject({ email, username, emailVerified: false, role: "outsider", points: 0 });
  const blocked = await page.request.post("/api/events/missing/register", { data: {} });
  expect(blocked.status()).toBe(403);
  expect(await blocked.json()).toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  await page.getByRole("button", { name: "I’ve verified my email" }).click();
  await expect(page.getByRole("status").filter({ hasText: "still waiting for verification" })).toBeVisible();

  const verificationPage = new URL(page.url());
  verificationPage.searchParams.set("error", "TOKEN_EXPIRED");
  await page.goto(verificationPage.toString());
  await expect(page.getByRole("alert").filter({ hasText: "expired or is invalid" })).toBeVisible();
  await page.getByRole("button", { name: "Resend verification email" }).click();
  await expect(page.getByRole("status").filter({ hasText: "new verification link" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("email-verification.png"), fullPage: true });

  await page.goto(await emailLink(request, email, "Verify your email", 2));
  await expect(page.getByRole("heading", { name: "Find your place at SDC." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "How membership works" })).toBeVisible();
  await page.getByRole("button", { name: "Continue where I left off" }).click();
  await expect(page).toHaveURL(/\/events$/);
  const after = await (await page.request.get("/api/auth/get-session", { params: { disableCookieCache: true } })).json();
  expect(after.user).toMatchObject({ emailVerified: true, role: "outsider" });
  await page.goto("/dashboard");
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.getByRole("link", { name: "Verify email", exact: true })).toHaveCount(0);
  if (testInfo.project.name === "Mobile Chrome") {
    await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByRole("combobox").fill("Notifications");
    await expect(page.getByRole("option", { name: "Notifications", exact: true })).toBeVisible();
    await expect.poll(() => page.locator(".club-command-dialog").evaluate(element => {
      const bounds = element.getBoundingClientRect();
      return bounds.left >= 0 && bounds.top >= 0 && bounds.right <= innerWidth;
    })).toBe(true);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("dialog")).toContainText("Explore events");
    await page.getByRole("dialog").press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await expect(page.locator("html")).toHaveJSProperty("scrollWidth", await page.locator("html").evaluate((element) => element.clientWidth));
  await page.screenshot({ path: testInfo.outputPath("first-dashboard.png"), fullPage: true });

  await page.request.post("/api/auth/sign-out", { data: {} });
  await page.goto("/forgot-password");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();
  await page.goto(await emailLink(request, email, "Reset your password"));
  await page.getByLabel("New password", { exact: true }).fill(newPassword);
  await page.getByLabel("Confirm password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Update password", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Password updated" })).toBeVisible();
  await page.getByRole("link", { name: "Continue to sign in" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(newPassword);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
