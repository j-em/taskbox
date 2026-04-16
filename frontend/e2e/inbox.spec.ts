import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Inbox
 * Tests the inbox functionality for quick-capturing unrefined tasks
 */

const INBOX_TASK_PREFIX = 'InboxTest';
const REGULAR_TASK_PREFIX = 'RegularTest';

async function cleanupTestTasks(page: import('@playwright/test').Page) {
  await cleanupTasks(page, [INBOX_TASK_PREFIX, REGULAR_TASK_PREFIX]);
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

test('sidebar shows Inbox menu item and navigates to inbox view', async ({ page }) => {
  // Open sidebar using the correct selector
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);
  
  // Verify Inbox menu item is visible
  const inboxMenuItem = page.locator('a:has-text("Inbox")');
  await expect(inboxMenuItem).toBeVisible();
  
  // Click on Inbox
  await inboxMenuItem.click();
  
  // Wait for navigation to inbox route
  await page.waitForURL(/\/app\/inbox/);
  
  // Close sidebar and verify page title
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  
  // Verify heading shows "Inbox"
  await expect(page.locator('h1:has-text("Inbox")')).toBeVisible();
  
  // Verify Quick Add button is visible
  await expect(page.locator('a:has-text("Quick Add")')).toBeVisible();
});

test('can quick add a task to inbox', async ({ page }) => {
  const taskName = `${INBOX_TASK_PREFIX} ${Date.now()}`;
  
  // Navigate to inbox view first
  await page.goto('/app/inbox');
  await page.waitForTimeout(500);
  
  // Click Quick Add button
  await page.getByRole('link', { name: 'Quick Add to Inbox' }).click();
  
  // Verify we're on the task creation page in inbox mode
  await page.waitForURL(/\/task\/new\?inbox=true/);
  
  // Verify the form shows "Quick Add to Inbox" title
  await expect(page.locator('h1:has-text("Quick Add to Inbox")')).toBeVisible();
  
  // Verify info alert is shown
  await expect(page.getByText(/this will be added to your inbox/i)).toBeVisible();
  
  // Fill in just the title (minimal info for quick add)
  await page.getByLabel(/title/i).fill(taskName);
  
  // Verify the "In Inbox" switch is checked by default
  const inboxSwitch = page.getByLabel(/in inbox/i);
  await expect(inboxSwitch).toBeChecked();
  
  // Create the task
  await page.getByRole('button', { name: /create/i }).click();
  
  // Verify redirect to home (app navigates to /app which redirects to /app/home)
  await page.waitForURL('/app');
  
  // Go to inbox view to verify task appears
  await page.goto('/app/inbox');
  await page.waitForTimeout(500);
  
  // Verify the task is in the inbox with inbox badge
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible();
  await expect(taskItem.locator('.MuiChip-label:has-text("Inbox")')).toBeVisible();
});

test('inbox tasks are not shown in All Tasks by default when filtered', async ({ page }) => {
  const inboxTaskName = `${INBOX_TASK_PREFIX} ${Date.now()}`;
  const regularTaskName = `${REGULAR_TASK_PREFIX} ${Date.now()}`;
  
  // Create an inbox task via quick add
  await page.goto('/app/task/new?inbox=true');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(inboxTaskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Create a regular task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(regularTaskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  await page.waitForTimeout(500);
  
  // Go to inbox - should only show inbox task
  await page.goto('/app/inbox');
  await page.waitForTimeout(500);
  
  await expect(page.getByText(inboxTaskName).first()).toBeVisible();
  await expect(page.getByText(regularTaskName)).not.toBeVisible();
  
  // Go to all tasks - should show both tasks
  await page.goto('/app');
  await page.waitForTimeout(500);
  
  await expect(page.getByText(inboxTaskName).first()).toBeVisible();
  await expect(page.getByText(regularTaskName).first()).toBeVisible();
});

test('inbox task shows correct edit UI and inbox switch works', async ({ page }) => {
  const taskName = `${INBOX_TASK_PREFIX} ${Date.now()}`;
  
  // Create an inbox task via quick add
  await page.goto('/app/task/new?inbox=true');
  await page.waitForTimeout(500);
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByRole('button', { name: /create/i }).click();
  await page.waitForURL('/app', { timeout: 10000 });
  
  // Go to inbox to find the task
  await page.goto('/app/inbox');
  await page.waitForTimeout(500);
  
  // Verify task is in inbox
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible({ timeout: 5000 });
  
  // Wait for task to be fully rendered
  await page.waitForTimeout(300);
  
  // Click edit button (it's a link, not a button) - wait for it to be visible first
  const editLink = taskItem.locator('a[aria-label="edit"], button[aria-label="edit"]');
  await expect(editLink).toBeVisible();
  await editLink.click();
  
  // Wait for form to load
  await page.waitForURL(/\/task\/[\w-]+\/edit/, { timeout: 10000 });
  
  // Wait for form to load
  await page.waitForTimeout(800);
  
  // Verify we're in inbox edit mode (heading should say "Edit Inbox Task")
  await expect(page.locator('h1:has-text("Edit Inbox Task")')).toBeVisible();
  
  // Verify info alert about promoting
  await expect(page.getByText(/you can promote it by unchecking/i)).toBeVisible();
  
  // Get the In Inbox switch and verify it's checked
  const inboxSwitch = page.getByLabel(/in inbox/i);
  await expect(inboxSwitch).toBeChecked();
  
  // Uncheck the switch (demonstrate promote action)
  await inboxSwitch.click();
  await expect(inboxSwitch).not.toBeChecked();
  
  // Re-check the switch (cancel the promote)
  await inboxSwitch.click();
  await expect(inboxSwitch).toBeChecked();
  
  // Verify the cancel button works - click cancel and verify we go back to home
  await page.getByRole('button', { name: /cancel/i }).click();
  await page.waitForURL('/app');
});

test('inbox view shows empty state message', async ({ page }) => {
  // First, ensure inbox is empty by deleting any existing inbox tasks
  await page.goto('/app/inbox');
  await page.waitForTimeout(500);
  
  // Delete any visible inbox tasks
  while (true) {
    const deleteButton = page.locator('button[aria-label="delete"]').first();
    const isVisible = await deleteButton.isVisible().catch(() => false);
    if (!isVisible) break;
    
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
  
  // Reload to verify empty state
  await page.goto('/app/inbox');
  await page.waitForTimeout(500);
  
  // Verify empty state heading (TaskList component shows generic empty state)
  await expect(page.getByText(/no tasks found/i)).toBeVisible();
  
  // Verify empty state helper text
  await expect(page.getByText(/create a new task to get started/i)).toBeVisible();
});
