import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Task Selection
 * Tests bulk task selection using checkboxes
 */

test('select and deselect multiple tasks using checkboxes', async ({ page }) => {
  const taskName1 = `Selection Test 1 ${Date.now()}`;
  const taskName2 = `Selection Test 2 ${Date.now()}`;
  const taskName3 = `Selection Test 3 ${Date.now()}`;

  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create 3 tasks
  for (const taskName of [taskName1, taskName2, taskName3]) {
    await page.getByRole('link', { name: 'Add Task' }).click();
    await page.getByLabel(/title/i).fill(taskName);
    await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
    await page.locator('button:has-text("Create")').click();
    await expect(page).toHaveURL(/\/app\/home/);
    await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });
  }

  // Find all task items and their checkboxes
  const taskItem1 = page.locator('li', { hasText: taskName1 }).first();
  const taskItem2 = page.locator('li', { hasText: taskName2 }).first();
  const taskItem3 = page.locator('li', { hasText: taskName3 }).first();

  const checkbox1 = taskItem1.locator('input[type="checkbox"]').first();
  const checkbox2 = taskItem2.locator('input[type="checkbox"]').first();
  const checkbox3 = taskItem3.locator('input[type="checkbox"]').first();

  // Verify all checkboxes start unchecked
  await expect(checkbox1).not.toBeChecked();
  await expect(checkbox2).not.toBeChecked();
  await expect(checkbox3).not.toBeChecked();

  // Click first checkbox - should become checked
  await checkbox1.click();
  await page.waitForTimeout(300);
  await expect(checkbox1).toBeChecked();
  await expect(checkbox2).not.toBeChecked();
  await expect(checkbox3).not.toBeChecked();

  // Click second checkbox - both should be checked now
  await checkbox2.click();
  await page.waitForTimeout(300);
  await expect(checkbox1).toBeChecked();
  await expect(checkbox2).toBeChecked();
  await expect(checkbox3).not.toBeChecked();

  // Click first checkbox again - only second should remain checked
  await checkbox1.click();
  await page.waitForTimeout(300);
  await expect(checkbox1).not.toBeChecked();
  await expect(checkbox2).toBeChecked();
  await expect(checkbox3).not.toBeChecked();

  // Click third checkbox - second and third should be checked
  await checkbox3.click();
  await page.waitForTimeout(300);
  await expect(checkbox1).not.toBeChecked();
  await expect(checkbox2).toBeChecked();
  await expect(checkbox3).toBeChecked();

  // Clean up - delete all 3 tasks
  await cleanupTasks(page, [taskName1, taskName2, taskName3]);
});
