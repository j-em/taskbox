import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Search
 * Tests the search functionality for finding tasks
 */

const SEARCH_TASK_PREFIX = 'SearchTest';

async function cleanupTestTasks(page: import('@playwright/test').Page) {
  await cleanupTasks(page, [SEARCH_TASK_PREFIX]);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Clean up any leftover test tasks
  await cleanupTestTasks(page);
});

test.afterEach(async ({ page }) => {
  await cleanupTestTasks(page);
});

test('sidebar shows Search menu item and navigates to search view', async ({ page }) => {
  // Open sidebar using the correct selector
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);

  // Verify Search menu item is visible
  const searchMenuItem = page.locator('a:has-text("Search")');
  await expect(searchMenuItem).toBeVisible();

  // Verify Search icon is present
  await expect(searchMenuItem.locator('svg')).toBeVisible();

  // Click on Search
  await searchMenuItem.click();

  // Wait for navigation to search route
  await page.waitForURL(/\/app\/search/);

  // Close sidebar and verify page title
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Verify heading shows "Search tasks"
  await expect(page.locator('h1:has-text("Search tasks")')).toBeVisible();

  // Verify search input is visible with Search icon
  const searchInput = page.locator('input[placeholder="Search tasks..."]');
  await expect(searchInput).toBeVisible();
  await expect(searchInput.locator('..').locator('svg')).toBeVisible();
});

test('search respects minimum character requirement', async ({ page }) => {
  // Navigate directly to search view
  await page.goto('/app/search');
  await page.waitForTimeout(500);

  const searchInput = page.locator('input[placeholder="Search tasks..."]');

  // Type 1 character
  await searchInput.fill('a');
  await page.waitForTimeout(100);

  // Verify helper text appears
  await expect(page.getByText(/type at least 2 characters to search/i)).toBeVisible();

  // Verify no task list is rendered (no Paper component with tasks)
  await expect(page.locator('li[role="listitem"]')).not.toBeVisible();

  // Clear the input
  await searchInput.clear();
  await page.waitForTimeout(100);

  // Verify helper text disappears when empty
  await expect(page.getByText(/type at least 2 characters to search/i)).not.toBeVisible();
});

test('search debounce waits 300ms before calling API', async ({ page }) => {
  // Navigate to search view and wait for it to load
  await page.goto('/app/search');
  await page.waitForURL(/\/app\/search/);
  await page.waitForTimeout(300);

  // Verify we're on the search page
  await expect(page.locator('h1:has-text("Search tasks")')).toBeVisible();

  const searchInput = page.locator('input[placeholder="Search tasks..."]');
  await expect(searchInput).toBeVisible();

  // Type a 3-character search term
  await searchInput.fill('xyz');

  // Immediately check (within 100ms) - should NOT show "No tasks found" yet
  // because debounce hasn't triggered
  await page.waitForTimeout(100);
  const hasEmptyStateEarly = await page.getByText(/no tasks found/i).isVisible().catch(() => false);
  expect(hasEmptyStateEarly).toBe(false);

  // Wait for debounce to trigger (300ms total from input, so 200ms more)
  await page.waitForTimeout(250);

  // Now loading or results should appear (API was called)
  // Either loading text or "No tasks found" (since xyz won't match anything)
  await expect(page.getByText(/no tasks found/i)).toBeVisible({ timeout: 5000 });
});

test('successful search returns matching tasks', async ({ page }) => {
  const uniqueTaskName = `${SEARCH_TASK_PREFIX} xyz123 ${Date.now()}`;

  // Create a task with searchable text
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(uniqueTaskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Navigate to search
  await page.goto('/app/search');
  await page.waitForTimeout(500);

  const searchInput = page.locator('input[placeholder="Search tasks..."]');

  // Search for unique portion of task name
  await searchInput.fill('xyz123');

  // Wait for debounce + API response
  await page.waitForTimeout(500);

  // Verify the created task appears in results
  await expect(page.getByText(uniqueTaskName).first()).toBeVisible({ timeout: 5000 });

  // Verify the task is in a list item
  const taskItem = page.locator('li', { hasText: uniqueTaskName }).first();
  await expect(taskItem).toBeVisible();
});

test('search with no matches shows empty state', async ({ page }) => {
  // Navigate to search
  await page.goto('/app/search');
  await page.waitForTimeout(500);

  const searchInput = page.locator('input[placeholder="Search tasks..."]');

  // Type a random string that won't match any tasks
  await searchInput.fill('zzzzzzzz99999');

  // Wait for debounce + API response
  await page.waitForTimeout(500);

  // Verify "No tasks found" message appears
  await expect(page.getByText(/no tasks found/i)).toBeVisible({ timeout: 5000 });

  // Verify "Create a new task to get started" helper text appears
  await expect(page.getByText(/create a new task to get started/i)).toBeVisible();
});
