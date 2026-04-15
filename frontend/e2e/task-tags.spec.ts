import { test, expect } from '@playwright/test';

/**
 * Feature: Task Tags
 * Tests tag creation, display (truncation in list vs full in detail), and editing
 */

test('create task with multiple tags and verify display', async ({ page }) => {
  const taskName = `Tagged Task ${Date.now()}`;
  const tags = ['urgent', 'frontend', 'e2e-test', 'playwright'];

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Navigate to create task form
  await page.locator('a:has-text("ADD")').click();
  await expect(page).toHaveURL(/\/task\/new/);

  // Fill in basic info
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Task with multiple tags for testing');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);

  // Add tags - type and press Enter for each
  const tagInput = page.getByLabel(/add tags/i);
  for (const tag of tags) {
    await tagInput.fill(tag);
    await tagInput.press('Enter');
    await page.waitForTimeout(200);
  }

  // Verify all 4 tags appear as chips in the form
  for (const tag of tags) {
    await expect(page.getByText(tag).first()).toBeVisible();
  }

  // Create the task
  await page.locator('button:has-text("Create")').click();

  // Verify redirect and task appears
  await expect(page).toHaveURL('/');
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // In list view: verify first 3 tags are shown, and "+1" chip for the 4th
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible();

  // Check that first 3 tags are visible in the list
  for (let i = 0; i < 3; i++) {
    await expect(taskItem.getByText(tags[i])).toBeVisible();
  }

  // Check for the "+1" indicator for the remaining tag
  await expect(taskItem.getByText('+1')).toBeVisible();

  // Click to navigate to detail view
  await taskItem.click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);

  // In detail view: verify all 4 tags are visible
  for (const tag of tags) {
    await expect(page.getByText(tag).first()).toBeVisible();
  }

  // Navigate back
  await page.goto('/');
  await page.waitForTimeout(500);

  // Clean up: delete the task
  const listItem = page.locator('li', { hasText: taskName }).first();
  if (await listItem.isVisible()) {
    const deleteButton = listItem.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
});

test('edit task tags - add and remove', async ({ page }) => {
  const taskName = `Tag Edit Test ${Date.now()}`;
  const initialTags = ['original', 'tag'];

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task with initial tags
  await page.locator('a:has-text("ADD")').click();
  await expect(page).toHaveURL(/\/task\/new/);

  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing tag editing');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);

  // Add initial tags
  const tagInput = page.getByLabel(/add tags/i);
  for (const tag of initialTags) {
    await tagInput.fill(tag);
    await tagInput.press('Enter');
    await page.waitForTimeout(200);
  }

  // Create the task
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');

  // Wait for task to appear and click to edit
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible({ timeout: 5000 });

  // Click edit link on the task item (it's a link with aria-label="edit")
  await taskItem.locator('a[aria-label="edit"]').click();
  await expect(page).toHaveURL(/\/task\/[\w-]+\/edit/);
  await page.waitForTimeout(1000); // Wait for form to load with data

  // Verify initial tags are shown as buttons (chips) in the form
  const formArea = page.locator('form').first();
  for (const tag of initialTags) {
    await expect(formArea.getByRole('button', { name: tag })).toBeVisible();
  }

  // Remove the first tag by clicking its delete icon
  // The chip is a button and has a delete icon as a child element
  const firstTagChip = formArea.getByRole('button', { name: initialTags[0] });
  await firstTagChip.locator('svg').click();
  await page.waitForTimeout(300);

  // Add a new tag
  await tagInput.fill('new-tag');
  await tagInput.press('Enter');
  await page.waitForTimeout(300);

  // Update the task
  await page.locator('button:has-text("Update")').click();

  // Form redirects to home page after update
  await expect(page).toHaveURL('/');

  // Find the task and click to see details with updated tags
  const updatedTaskItem = page.locator('li', { hasText: taskName }).first();
  await expect(updatedTaskItem).toBeVisible();
  await updatedTaskItem.click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);

  // Verify the updated tags are visible
  // 'new-tag' should be present (we added it)
  await expect(page.getByText('new-tag').first()).toBeVisible();
  // 'tag' should still be there (we didn't remove it)
  await expect(page.getByText('tag').first()).toBeVisible();

  // Navigate back and clean up
  await page.goto('/');
  await page.waitForTimeout(500);

  const item = page.locator('li', { hasText: taskName }).first();
  if (await item.isVisible().catch(() => false)) {
    const deleteButton = item.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
});
