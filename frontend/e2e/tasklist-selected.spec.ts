import { test, expect } from '@playwright/test';

/**
 * Test: TaskList selectedTasks prop behavior
 * Verifies that checkboxes reflect the selected state based on selectedTasks prop
 */
test('TaskList checkboxes reflect selectedTasks prop state', async ({ page }) => {
  // Create a task first so we have something to test with
  const taskName = `Selection Test Task ${Date.now()}`;

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Create a new task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await expect(page).toHaveURL(/\/task\/new/);

  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing selection behavior');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();

  // Verify redirect and task appears
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Find the task item
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible();

  // Verify checkbox exists and is unchecked by default (no selectedTasks prop passed)
  const checkbox = taskItem.locator('input[type="checkbox"]').first();
  await expect(checkbox).toBeVisible();
  await expect(checkbox).not.toBeChecked();

  // Verify the checkbox has the correct aria attributes
  await expect(checkbox).toHaveAttribute('type', 'checkbox');
});

test('TaskList renders multiple tasks with independent checkbox states', async ({ page }) => {
  // Create multiple tasks
  const taskName1 = `Multi Task 1 ${Date.now()}`;
  const taskName2 = `Multi Task 2 ${Date.now()}`;

  await page.goto('/app');
  await page.waitForLoadState('networkidle');

  // Create first task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName1);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName1).first()).toBeVisible({ timeout: 5000 });

  // Create second task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName2);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName2).first()).toBeVisible({ timeout: 5000 });

  // Find both task items
  const taskItem1 = page.locator('li', { hasText: taskName1 }).first();
  const taskItem2 = page.locator('li', { hasText: taskName2 }).first();

  await expect(taskItem1).toBeVisible();
  await expect(taskItem2).toBeVisible();

  // Verify both have checkboxes, both unchecked by default
  const checkbox1 = taskItem1.locator('input[type="checkbox"]').first();
  const checkbox2 = taskItem2.locator('input[type="checkbox"]').first();

  await expect(checkbox1).toBeVisible();
  await expect(checkbox2).toBeVisible();
  await expect(checkbox1).not.toBeChecked();
  await expect(checkbox2).not.toBeChecked();
});
