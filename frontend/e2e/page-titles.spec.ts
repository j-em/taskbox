import { test, expect } from '@playwright/test';

/**
 * Feature: Page Titles
 * Tests that React 19's built-in <title> elements are working correctly
 */

test.describe('Page Titles', () => {
  test('home page shows correct title', async ({ page }) => {
    await page.goto('/app/home');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | All Tasks');
  });

  test('home page with status filter shows correct title', async ({ page }) => {
    await page.goto('/app/home?status=TODO');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | To Do');
  });

  test('inbox page shows correct title', async ({ page }) => {
    await page.goto('/app/inbox');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | Inbox');
  });

  test('today page shows correct title', async ({ page }) => {
    await page.goto('/app/today');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | Today');
  });

  test('anytime page shows correct title', async ({ page }) => {
    await page.goto('/app/anytime');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | Anytime');
  });

  test('settings page shows correct title', async ({ page }) => {
    await page.goto('/app/settings');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | Settings');
  });

  test('settings about page shows correct title', async ({ page }) => {
    await page.goto('/app/settings/about');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | About');
  });

  test('search page shows correct title', async ({ page }) => {
    await page.goto('/app/search');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | Search');
  });

  test('404 page shows correct title', async ({ page }) => {
    await page.goto('/app/nonexistent-page');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | Page Not Found');
  });

  test('task editor page shows correct title for new task', async ({ page }) => {
    await page.goto('/app/task/new');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveTitle('Taskbox | New Task');
  });

  test('page title updates when navigating between routes', async ({ page }) => {
    // Start at home
    await page.goto('/app/home');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle('Taskbox | All Tasks');

    // Navigate to inbox via sidebar
    await page.locator('button[aria-label="toggle sidebar"]').click();
    await page.waitForTimeout(300);
    await page.locator('a:has-text("Inbox")').click();
    await page.waitForLoadState('networkidle');
    
    // Verify title changed
    await expect(page).toHaveTitle('Taskbox | Inbox');

    // Navigate to today - close sidebar first by clicking elsewhere or using Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    
    // Now open sidebar and navigate
    await page.locator('button[aria-label="toggle sidebar"]').click();
    await page.waitForTimeout(300);
    await page.locator('a:has-text("Today")').click();
    await page.waitForLoadState('networkidle');
    
    // Verify title changed
    await expect(page).toHaveTitle('Taskbox | Today');
  });
});
