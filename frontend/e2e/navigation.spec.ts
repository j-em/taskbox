import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Navigation
 * Tests browser history, 404 pages, task navigation, and keyboard navigation
 */

test('browser history navigation maintains state', async ({ page }) => {
  const taskName = `History Nav Test ${Date.now()}`;

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing browser navigation');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Click on task to navigate to detail view
  await page.getByText(taskName).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText('Testing browser navigation')).toBeVisible();

  // Navigate to edit page
  await page.locator('a:has-text("Edit")').first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+\/edit/);
  await expect(page.getByLabel(/title/i)).toHaveValue(taskName);

  // Click browser back - should return to detail view
  await page.goBack();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  // Verify we're NOT on the edit page (no /edit suffix)
  await expect(page).not.toHaveURL(/\/edit$/);
  await expect(page.getByText('Testing browser navigation')).toBeVisible();

  // Click browser back again - should return to home
  await page.goBack();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible();

  // Click browser forward - should go to detail view again
  await page.goForward();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText(taskName).first()).toBeVisible();

  // Navigate back home for cleanup
  await page.goto('/app');
  await page.waitForTimeout(500);

  // Clean up
  await cleanupTasks(page, [taskName]);
});

test('click task title navigates to detail view', async ({ page }) => {
  const taskName = `Navigation Test ${Date.now()}`;

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task first
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing navigation via title click');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL(/\/app\/home/);

  // Find the task
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible({ timeout: 5000 });

  // Click on the task title (the primary text in the ListItem)
  // The task item is a link that wraps the whole content
  await taskItem.click();

  // Verify navigation to detail page
  await expect(page).toHaveURL(/\/task\/[\w-]+/);

  // Verify detail view shows correct content
  await expect(page.getByText(taskName).first()).toBeVisible();
  await expect(page.getByText('Testing navigation via title click')).toBeVisible();

  // Navigate back and clean up
  await page.goto('/app');
  await page.waitForTimeout(500);

  const deleteItem = page.locator('li', { hasText: taskName }).first();
  if (await deleteItem.isVisible().catch(() => false)) {
    const deleteButton = deleteItem.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
});

test('keyboard navigation through app interface', async ({ page }) => {
  const taskName = `Keyboard Test ${Date.now()}`;

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task first
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Focus the sidebar button and test keyboard interaction
  const sidebarButton = page.locator('button[aria-label="toggle sidebar"]');
  await sidebarButton.focus();
  
  // Press Enter to open sidebar
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);

  // Verify sidebar is visible by checking for sidebar link that only appears there
  const sidebarLink = page.getByRole('link', { name: 'All Tasks' });
  await expect(sidebarLink).toBeVisible();

  // Press Escape to close sidebar
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Verify sidebar closed - the sidebar link should not be visible
  await expect(sidebarLink).not.toBeVisible();

  // Test form field navigation on home page
  // Tab to a task item and press Enter to navigate
  const taskLink = page.locator('li', { hasText: taskName }).first();
  await taskLink.locator('a').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  
  // Should be on task detail page
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText(taskName).first()).toBeVisible();

  // Navigate back home
  await page.goto('/app');
  await page.waitForTimeout(500);

  // Clean up
  await cleanupTasks(page, [taskName]);
});

test('404 page provides working navigation back home', async ({ page }) => {
  // Navigate to a non-existent route
  await page.goto('/nonexistent-route-404-test');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify 404 page content
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByText(/page not found/i)).toBeVisible();
  await expect(page.getByText(/the page you are looking for does not exist/i)).toBeVisible();

  // Verify "Go Home" button exists
  const goHomeButton = page.locator('button:has-text("Go Home"), a:has-text("Go Home")').first();
  await expect(goHomeButton).toBeVisible();

  // Click the button and verify navigation
  await goHomeButton.click();
  await expect(page).toHaveURL(/\/app\/home/);

  // Verify we're on the home page by checking for "All Tasks" heading
  await expect(page.getByText('All Tasks').first()).toBeVisible();
});
