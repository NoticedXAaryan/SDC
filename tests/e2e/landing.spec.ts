import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('footer visual regression', async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');

    // Wait for the footer to be visible (using semantic tag or specific component if possible)
    // We assume the footer has a specific role or tag, standard in Astryx-first/Shadcn UI is often <footer>
    const footer = page.locator('footer');
    
    // Ensure the footer is in the viewport and fully loaded
    await footer.scrollIntoViewIfNeeded();
    await footer.waitFor({ state: 'visible' });
    
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
