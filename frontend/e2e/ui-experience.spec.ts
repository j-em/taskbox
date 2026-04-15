import { test, expect } from '@playwright/test';

/**
 * Feature: UI Experience
 * Tests theme toggle, loading states, empty states, and responsive sidebar
 */

test('theme toggle switches between light and dark mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Get the theme toggle button (it has aria-label containing "mode")
  const themeButton = page.locator('button[aria-label*="mode"]');
  await expect(themeButton).toBeVisible();

  // Check initial theme by looking at MUI's data attribute on html element
  const getTheme = () => page.evaluate(() => {
    // MUI v5+ sets data-mui-color-scheme on html element
    const html = document.documentElement;
    const muiScheme = html.getAttribute('data-mui-color-scheme');
    if (muiScheme) return muiScheme;
    
    // Fallback: check computed background color
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    // Dark mode typically has rgb(18, 18, 18) or similar dark color
    const isDark = bodyBg.includes('18') || bodyBg.includes('0, 0, 0') || bodyBg.includes('rgb(30');
    return isDark ? 'dark' : 'light';
  });

  const initialTheme = await getTheme();
  console.log(`Initial theme: ${initialTheme}`);

  // Toggle theme
  await themeButton.click();
  await page.waitForTimeout(800);

  // Verify theme changed
  const newTheme = await getTheme();
  console.log(`After toggle: ${newTheme}`);
  expect(newTheme).not.toBe(initialTheme);

  // Toggle back
  await themeButton.click();
  await page.waitForTimeout(800);

  // Verify theme toggled back
  const finalTheme = await getTheme();
  console.log(`After second toggle: ${finalTheme}`);
  expect(finalTheme).toBe(initialTheme);
});

test('loading spinner appears during data fetch', async ({ page }) => {
  // Simulate slow network using route interception
  await page.route('**/api/v1/tasks**', async (route) => {
    // Delay the response by 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await route.continue();
  });

  await page.goto('/');
  
  // Immediately check for loading spinner before data loads
  // Use a short timeout since we expect it to appear quickly
  const spinner = page.locator('[role="progressbar"], .MuiCircularProgress-root, .loading-spinner').first();
  
  // The spinner should be visible initially
  await expect(spinner).toBeVisible({ timeout: 500 });

  // Wait for data to load (spinner should disappear)
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Spinner should be gone now
  await expect(spinner).not.toBeVisible();

  // The task list or empty state should be visible
  const taskList = page.locator('[role="list"], .MuiList-root').first();
  const emptyState = page.getByText(/no tasks found/i);
  
  // At least one of these should be visible
  const hasTaskList = await taskList.isVisible().catch(() => false);
  const hasEmptyState = await emptyState.isVisible().catch(() => false);
  expect(hasTaskList || hasEmptyState).toBe(true);

  // Clean up - unroute to restore normal behavior
  await page.unroute('**/api/v1/tasks**');
});

test('empty state shows when no tasks exist for filter', async ({ page }) => {
  await page.goto('/?status=CANCELLED');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Verify "No tasks found" message is visible
  await expect(page.getByText(/no tasks found/i)).toBeVisible();
  await expect(page.getByText(/create a new task to get started/i)).toBeVisible();

  // Verify "Add Task" button is still available
  await expect(page.locator('a:has-text("ADD"), button:has-text("Add")').first()).toBeVisible();

  // Navigate to a view that should have tasks
  await page.goto('/');
  await page.waitForTimeout(500);

  // Verify tasks are shown (we've created tasks in previous tests)
  const taskList = page.locator('[role="list"], .MuiList-root').first();
  await expect(taskList).toBeVisible();
});

test('sidebar opens and closes on mobile viewport', async ({ page }) => {
  // Set viewport to mobile size (iPhone-like dimensions)
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify sidebar is not visible initially ( Drawer is closed on mobile)
  const sidebar = page.locator('.MuiDrawer-root, [role="dialog"]').first();
  await expect(sidebar).not.toBeVisible();

  // Open sidebar using the menu button
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(600);

  // Verify sidebar is now visible
  await expect(sidebar).toBeVisible();

  // Verify sidebar contains navigation links
  await expect(sidebar.getByText('All Tasks')).toBeVisible();
  await expect(sidebar.getByText('To Do')).toBeVisible();

  // Click a navigation link to close sidebar
  await sidebar.getByText('All Tasks').click();
  await page.waitForTimeout(400);

  // Verify sidebar closed after navigation
  await expect(sidebar).not.toBeVisible();

  // Verify we're still on the home page
  await expect(page.getByText('All Tasks').first()).toBeVisible();
});
