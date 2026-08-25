import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('footer visual regression', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');

    // The server-rendered shell is replaced once the viewer state hydrates on
    // narrow viewports, so wait for that handoff before holding a locator.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(250);

    // Select the semantic page footer explicitly. Using the role keeps this
    // stable even when visual-effect wrappers are present in desktop Chromium.
    const footer = page.getByRole('contentinfo').first();
    
    // Ensure the footer is in the viewport and fully loaded
    await footer.waitFor({ state: 'visible' });
    await footer.scrollIntoViewIfNeeded();
    
    // Allow any animations to settle
    await page.waitForTimeout(1000);

    // Take a screenshot of the footer and compare it to the baseline
    // Using explicit screenshot() and toMatchSnapshot() prevents Playwright from 
    // timing out waiting for the bg-noise animation to stabilize.
    const screenshot = await footer.screenshot({ animations: 'disabled' });
    expect(screenshot).toMatchSnapshot('landing-footer.png', {
      maxDiffPixelRatio: 0.05, // Allow up to 5% diff for noise patterns
    });
  });
});
