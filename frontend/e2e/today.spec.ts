import { test, expect, type Page } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Today View
 * Tests the Today view functionality for showing tasks scheduled for today
 */

const TODAY_TASK_PREFIX = 'TodayTest';
const TIMEZONE_TASK_PREFIX = 'TimezoneTest';

async function cleanupTestTasks(page: import('@playwright/test').Page) {
  await cleanupTasks(page, [TODAY_TASK_PREFIX, TIMEZONE_TASK_PREFIX]);
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

test('today view shows correct tasks in late evening (UTC-10 timezone) - exposes tomorrow bug', async ({ browser }) => {
  // This test exposes the timezone bug where toISOString() converts to UTC
  // User in Hawaii (UTC-10) at 11:30 PM local time (April 16) sees UTC date as April 17
  
  // 1. Create a new browser context with Hawaii timezone via launch args
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'Pacific/Honolulu',
  });
  const page = await context.newPage();
  
  // 2. Mock system time: 9:30 AM UTC April 17 = 11:30 PM April 16 in Hawaii (UTC-10)
  // At this time:
  // - Local Hawaii date is April 16 (what user expects as "today")
  // - UTC date is April 17 (what toISOString() returns)
  await page.clock.setFixedTime(new Date('2026-04-17T09:30:00Z'));
  
  const taskName = `${TIMEZONE_TASK_PREFIX} Hawaii Evening ${Date.now()}`;
  
  // 3. Create a task with the default date (which should now be local date)
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  
  // Verify the default scheduled date shows the LOCAL date (April 16) - FIXED!
  const dateInput = page.getByLabel(/scheduled date/i);
  await expect(dateInput).toHaveValue('2026-04-16');
  // The date is already correct, no need to change it
  
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // 4. Navigate to Today view
  await page.goto('/app/today');
  await page.waitForTimeout(500);
  
  // 5. With the fix, both the task editor and Today view use local date:
  // - Task was created for April 16 (local date)
  // - Today view queries for April 16 (local date)
  // - Result: Task IS visible as expected!
  await expect(page.getByText(taskName)).toBeVisible();
  
  await context.close();
});

test('today view shows correct tasks in early morning (UTC+10 timezone) - exposes yesterday bug', async ({ browser }) => {
  // This test exposes the opposite timezone bug
  // User in Sydney (UTC+10) at 2:00 AM local time (April 17) sees UTC date as April 16
  
  // 1. Create a new browser context with Sydney timezone
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'Australia/Sydney',
  });
  const page = await context.newPage();
  
  // 2. Mock system time: 4:00 PM UTC April 16 = 2:00 AM April 17 in Sydney (UTC+10)
  // At this time:
  // - Local Sydney date is April 17 (what user expects as "today")
  // - UTC date is April 16 (what old toISOString() returned)
  await page.clock.setFixedTime(new Date('2026-04-16T16:00:00Z'));
  
  const taskName = `${TIMEZONE_TASK_PREFIX} Sydney Morning ${Date.now()}`;
  
  // 3. Create a task with the default date
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  
  // Verify the default scheduled date shows the LOCAL date (April 17) - FIXED!
  const dateInput = page.getByLabel(/scheduled date/i);
  await expect(dateInput).toHaveValue('2026-04-17');
  
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // 4. Navigate to Today view
  await page.goto('/app/today');
  await page.waitForTimeout(500);
  
  // 5. With the fix:
  // - Task was created for April 17 (local date)
  // - Today view queries for April 17 (local date)
  // - Result: Task IS visible as expected!
  await expect(page.getByText(taskName)).toBeVisible();
  
  await context.close();
});

test('today view date filter matches the default date shown in task editor', async ({ browser }) => {
  // This test verifies that the date shown in the task editor's default
  // matches what the Today view queries for
  
  // 1. Create a new browser context with Hawaii timezone (extreme case)
  const context = await browser.newContext({
    locale: 'en-US',
    timezoneId: 'Pacific/Honolulu',
  });
  const page = await context.newPage();
  
  // 2. Mock system time: 11:30 PM April 16 Hawaii = 9:30 AM April 17 UTC
  await page.clock.setFixedTime(new Date('2026-04-17T09:30:00Z'));
  
  const taskName = `${TIMEZONE_TASK_PREFIX} Consistency ${Date.now()}`;
  
  // 3. Open task editor and note the default scheduled date
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  const defaultDate = await page.getByLabel(/scheduled date/i).inputValue();
  
  // In Hawaii at 11:30 PM, the local date is April 16
  expect(defaultDate).toBe('2026-04-16');
  
  // 4. Create a task with that default date
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // 5. Go to Today view - it should query for the same date
  await page.goto('/app/today');
  await page.waitForTimeout(500);
  
  // The task should appear because Today view uses the same local date
  await expect(page.getByText(taskName)).toBeVisible();
  
  await context.close();
});

test('sidebar shows Today menu item and navigates to today view', async ({ page }) => {
  // Open sidebar using the correct selector
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);
  
  // Verify Today menu item is visible
  const todayMenuItem = page.locator('a:has-text("Today")');
  await expect(todayMenuItem).toBeVisible();
  
  // Click on Today
  await todayMenuItem.click();
  
  // Wait for navigation to today route
  await page.waitForURL(/\/app\/today/);
  
  // Close sidebar and verify page title
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  
  // Verify heading shows "Today"
  await expect(page.locator('h1:has-text("Today")')).toBeVisible();
  
  // Verify Quick Add button is visible
  await expect(page.getByRole('link', { name: /Quick Add/ })).toBeVisible();
  
  // Verify Add Task button is visible
  await expect(page.getByRole('link', { name: /Add Task/ })).toBeVisible();
});

test('can quick add a task for today and see it in today view', async ({ page }) => {
  const taskName = `${TODAY_TASK_PREFIX} ${Date.now()}`;
  
  // Navigate to today view first
  await page.goto('/app/today');
  await page.waitForTimeout(500);
  
  // Click Quick Add button
  await page.getByRole('link', { name: /Quick Add/ }).click();
  
  // Verify we're on the task creation page
  await page.waitForURL(/\/task\/new/);
  
  // Verify scheduled date defaults to today (ISO format in input)
  const todayDate = new Date().toISOString().split('T')[0];
  const dateInput = page.getByLabel(/scheduled date/i);
  await expect(dateInput).toHaveValue(todayDate);
  
  // Fill in the title
  await page.getByLabel(/title/i).fill(taskName);
  
  // Create the task
  await page.getByRole('button', { name: /create/i }).click();
  
  // Verify redirect to /app
  await page.waitForURL('/app');
  
  // Go to today view to verify task appears
  await page.goto('/app/today');
  await page.waitForTimeout(500);
  
  // Verify the task appears in the today view
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible();
  
  // Task appearing in Today view confirms the date filtering works correctly
});

test('tasks scheduled for future dates do not appear in today view', async ({ page }) => {
  const todayTaskName = `${TODAY_TASK_PREFIX} Today ${Date.now()}`;
  const futureTaskName = `${TODAY_TASK_PREFIX} Future ${Date.now()}`;
  
  // Create a task for today
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(todayTaskName);
  // Scheduled date defaults to today, so just create
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Create a task for tomorrow
  await page.goto('/app/task/new');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(futureTaskName);
  
  // Set scheduled date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  await page.getByLabel(/scheduled date/i).fill(tomorrowDate);
  
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Go to today view
  await page.goto('/app/today');
  await page.waitForTimeout(500);
  
  // Verify today's task is visible
  await expect(page.getByText(todayTaskName).first()).toBeVisible();
  
  // Verify tomorrow's task is NOT visible
  await expect(page.getByText(futureTaskName)).not.toBeVisible();
});
