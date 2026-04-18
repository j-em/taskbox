import { test, expect } from '@playwright/test';

/**
 * Feature: Settings Screen
 * Tests settings navigation, About screen functionality, and settings persistence
 */

test('navigate to settings from sidebar and verify page content', async ({ page }) => {
  // Start from home page
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Open sidebar using the toggle button
  const sidebarButton = page.locator('button[aria-label="toggle sidebar"]');
  await sidebarButton.click();
  await page.waitForTimeout(300);

  // Verify sidebar shows Settings option
  const settingsLink = page.getByRole('link', { name: /settings/i });
  await expect(settingsLink).toBeVisible();

  // Click on Settings
  await settingsLink.click();
  await page.waitForTimeout(500);

  // Verify we're on the settings page
  await expect(page).toHaveURL(/\/app\/settings$/);

  // Verify settings page content
  await expect(page.getByText('Settings').first()).toBeVisible();
  await expect(page.getByText('About')).toBeVisible();
  await expect(page.getByText('App information, version, and credits')).toBeVisible();

  // Close sidebar
  await page.keyboard.press('Escape');
});

test('navigate to About screen and verify app information', async ({ page }) => {
  // Navigate directly to settings page
  await page.goto('/app/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify settings page is loaded
  await expect(page.getByText('Settings').first()).toBeVisible();

  // Click on About row
  const aboutRow = page.getByRole('link', { name: /about/i });
  await aboutRow.click();
  await page.waitForTimeout(500);

  // Verify we're on the About page
  await expect(page).toHaveURL(/\/app\/settings\/about$/);

  // Verify About page header
  await expect(page.getByText('About').first()).toBeVisible();

  // Verify About page content - use more specific selectors
  const list = page.locator('ul, ol, [role="list"]').first();
  await expect(list.getByText('Taskbox', { exact: true })).toBeVisible();
  await expect(list.getByText('1.0.0')).toBeVisible();
  await expect(list.getByText('Task Management')).toBeVisible();
  await expect(list.getByText('Jeremy Allard')).toBeVisible();

  // Verify the labels are visible too
  await expect(page.getByText('App Name').first()).toBeVisible();
  await expect(page.getByText('Version').first()).toBeVisible();
  await expect(page.getByText('Description').first()).toBeVisible();
  await expect(page.getByText('Author').first()).toBeVisible();

  // Verify back button exists (IconButton with component={Link} renders as <a>)
  const backButton = page.locator('a[aria-label="Back to Settings"]');
  await expect(backButton).toBeVisible();
});

test('About screen back button returns to Settings', async ({ page }) => {
  // Navigate directly to About page
  await page.goto('/app/settings/about');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify we're on the About page
  await expect(page).toHaveURL(/\/app\/settings\/about$/);
  await expect(page.getByText('About').first()).toBeVisible();

  // Verify all app info labels are displayed
  await expect(page.getByText('App Name').first()).toBeVisible();
  await expect(page.getByText('Version').first()).toBeVisible();
  await expect(page.getByText('Description').first()).toBeVisible();
  await expect(page.getByText('Author').first()).toBeVisible();

  // Click the back button (renders as <a> tag due to component={Link})
  const backButton = page.locator('a[aria-label="Back to Settings"]');
  await expect(backButton).toBeVisible({ timeout: 5000 });
  await backButton.click();
  await page.waitForTimeout(500);

  // Verify we returned to Settings page
  await expect(page).toHaveURL(/\/app\/settings$/);
  await expect(page.getByText('Settings').first()).toBeVisible();
  await expect(page.getByText('About')).toBeVisible();
});
