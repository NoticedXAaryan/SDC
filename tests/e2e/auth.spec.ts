import { expect, test } from "@playwright/test";

test.describe("Authentication", () => {
  test("preserves a safe destination between sign-in and registration", async ({ page }) => {
    await page.goto("/login?callbackUrl=%2Fevents%2Fcreate");

    await expect(page.getByRole("heading", { name: "Sign in to your orbit" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register?callbackUrl=%2Fevents%2Fcreate",
    );
  });

  test("rejects an external callback destination", async ({ page }) => {
    await page.goto("/login?callbackUrl=https%3A%2F%2Fevil.example");

    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  test("shows a recoverable state for an incomplete reset link", async ({ page }) => {
    await page.goto("/reset-password");

    await expect(page.getByRole("heading", { name: "Choose a new password" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});

test.describe("Protected routes", () => {
  for (const route of ["/tasks", "/setup"]) {
    test(`redirects guests away from ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(`/login\\?callbackUrl=${encodeURIComponent(route)}`));
    });
  }
});
