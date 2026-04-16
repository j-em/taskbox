import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Anytime View
 * Tests the Anytime view functionality for showing tasks with no scheduled date
 */

const ANYTIME_TASK_PREFIX = 'AnytimeTest';

async function cleanupTestTasks(page: import('@playwright/test').Page) {
  await cleanupTasks(page, [ANYTIME_TASK_PREFIX]);
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

test('sidebar shows Anytime menu item and navigates to anytime view', async ({ page }) => {
  // Open sidebar using the correct selector
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);
  
  // Verify Anytime menu item is visible
  const anytimeMenuItem = page.locator('a:has-text("Anytime")');
  await expect(anytimeMenuItem).toBeVisible();
  
  // Click on Anytime
  await anytimeMenuItem.click();
  
  // Wait for navigation to anytime route
  await page.waitForURL(/\/app\/anytime/);
  
  // Close sidebar and verify page title
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  
  // Verify heading shows "Anytime"
  await expect(page.locator('h1:has-text("Anytime")')).toBeVisible();
  
  // Verify Quick Add button is visible
  await expect(page.getByRole('link', { name: /Quick Add/ })).toBeVisible();
  
  // Verify Add Task button is visible
  await expect(page.getByRole('link', { name: /Add Task/ })).toBeVisible();
});

test('can quick add a task without scheduled date and see it in anytime view', async ({ page }) => {
  const taskName = `${ANYTIME_TASK_PREFIX} ${Date.now()}`;
  
  // Navigate to anytime view first
  await page.goto('/app/anytime');
  await page.waitForTimeout(500);
  
  // Click Quick Add button
  await page.getByRole('link', { name: /Quick Add/ }).click();
  
  // Verify we're on the task creation page
  await page.waitForURL(/\/task\/new/);
  
  // For anytime tasks, scheduled date should be empty (no default)
  const dateInput = page.getByLabel(/scheduled date/i);
  // The date should be empty or today's date - but either way we'll clear it
  await dateInput.fill('');
  
  // Fill in the title
  await page.getByLabel(/title/i).fill(taskName);
  
  // Create the task
  await page.getByRole('button', { name: /create/i }).click();
  
  // Verify redirect to /app
  await page.waitForURL('/app');
  
  // Go to anytime view to verify task appears
  await page.goto('/app/anytime');
  await page.waitForTimeout(500);
  
  // Verify the task appears in the anytime view
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible();
  
  // Task appearing in Anytime view confirms the null date filtering works correctly
});

test('tasks with scheduled dates do not appear in anytime view', async ({ page }) => {
  const anytimeTaskName = `${ANYTIME_TASK_PREFIX} NoDate ${Date.now()}`;
  const scheduledTaskName = `${ANYTIME_TASK_PREFIX} WithDate ${Date.now()}`;
  
  // Create a task with NO scheduled date (for Anytime view)
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(anytimeTaskName);
  // Clear the scheduled date to make it an "anytime" task
  await page.getByLabel(/scheduled date/i).fill('');
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Create a task WITH a scheduled date
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(scheduledTaskName);
  // Scheduled date defaults to today, leave it as is
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Go to anytime view
  await page.goto('/app/anytime');
  await page.waitForTimeout(500);
  
  // Verify the anytime task (no date) is visible
  await expect(page.getByText(anytimeTaskName).first()).toBeVisible();
  
  // Verify the scheduled task is NOT visible in anytime view
  await expect(page.getByText(scheduledTaskName)).not.toBeVisible();
});
