import { test, expect } from '@playwright/test';

/**
 * Feature: Logo
 * Tests that the logo images load correctly in both light and dark modes
 */

test('logo appears in app bar and sidebar', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Check logo in AppBar (the main navigation bar at top)
  const appBarLogo = page.locator('img[alt="Taskbox"]').first();
  await expect(appBarLogo).toBeVisible();
  
  // Verify the image has loaded (has width > 0)
  const logoWidth = await appBarLogo.evaluate(el => (el as HTMLImageElement).naturalWidth);
  expect(logoWidth).toBeGreaterThan(0);

  // Open sidebar to check sidebar logo
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);

  // Check logo in Sidebar
  const sidebarLogo = page.locator('img[alt="Taskbox"]').nth(1);
  await expect(sidebarLogo).toBeVisible();
  
  const sidebarLogoWidth = await sidebarLogo.evaluate(el => (el as HTMLImageElement).naturalWidth);
  expect(sidebarLogoWidth).toBeGreaterThan(0);
});

test('logo switches between light and dark mode', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Open sidebar to test the sidebar logo which respects theme mode
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);

  // Get sidebar logo source (uses auto variant, follows theme mode)
  const sidebarLogo = page.locator('img[alt="Taskbox"]').nth(1);
  await expect(sidebarLogo).toBeVisible();
  
  const initialSrc = await sidebarLogo.getAttribute('src');
  const isInitiallyLight = initialSrc?.includes('logo_light.png');
  
  // Verify initial state matches theme
  expect(initialSrc).toContain(isInitiallyLight ? 'logo_light.png' : 'logo_dark.png');

  // Close sidebar by pressing Escape (backdrop blocks clicks otherwise)
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Toggle theme
  await page.locator('button[aria-label*="Switch to"]').click();
  await page.waitForTimeout(300);

  // Re-open sidebar to check logo changed
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);

  // Check logo source changed
  const toggledSrc = await sidebarLogo.getAttribute('src');
  if (isInitiallyLight) {
    expect(toggledSrc).toContain('logo_dark.png');
  } else {
    expect(toggledSrc).toContain('logo_light.png');
  }

  // Close sidebar again
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Toggle back
  await page.locator('button[aria-label*="Switch to"]').click();
  await page.waitForTimeout(300);

  // Re-open sidebar to verify logo changed back
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);

  // Check logo source changed back
  const backSrc = await sidebarLogo.getAttribute('src');
  expect(backSrc).toBe(initialSrc);
});

test('logo links to home page', async ({ page }) => {
  // First navigate to settings page
  await page.goto('/app/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify we're on settings page
  await expect(page).toHaveURL(/\/app\/settings/);

  // Click on the logo (it's wrapped in a Link)
  const logoLink = page.locator('img[alt="Taskbox"]').first().locator('..');
  await logoLink.click();
  await page.waitForTimeout(500);

  // Should navigate to home
  await expect(page).toHaveURL(/\/app\/home/);
});
