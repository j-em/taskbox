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

  // Get initial logo source (should be light mode by default)
  const logo = page.locator('img[alt="Taskbox"]').first();
  await expect(logo).toBeVisible();
  
  const lightSrc = await logo.getAttribute('src');
  expect(lightSrc).toContain('logo_light.png');

  // Toggle to dark mode
  await page.locator('button[aria-label*="dark"]').click();
  await page.waitForTimeout(300);

  // Check logo source changed to dark
  const darkSrc = await logo.getAttribute('src');
  expect(darkSrc).toContain('logo_dark.png');

  // Toggle back to light mode
  await page.locator('button[aria-label*="light"]').click();
  await page.waitForTimeout(300);

  // Check logo source changed back to light
  const backToLightSrc = await logo.getAttribute('src');
  expect(backToLightSrc).toContain('logo_light.png');
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
