import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Data Persistence
 * Tests data survival after page refresh and URL filter persistence
 */

test('tasks persist after page refresh', async ({ page }) => {
  const taskName = `Persistence Test ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing persistence after refresh');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Note the task URL before refresh
  await page.getByText(taskName).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  const detailUrl = page.url();
  
  // Verify description is visible
  await expect(page.getByText('Testing persistence after refresh')).toBeVisible();

  // Refresh the page
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Verify we're still on the same URL and data is still visible
  await expect(page).toHaveURL(detailUrl);
  await expect(page.getByText(taskName).first()).toBeVisible();
  await expect(page.getByText('Testing persistence after refresh')).toBeVisible();

  // Go back to home and refresh there too
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Refresh at home
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Verify task still appears in the list
  await expect(page.getByText(taskName).first()).toBeVisible();

  // Clean up
  await cleanupTasks(page, [taskName]);
});

test('filter state persists in URL and survives refresh', async ({ page }) => {
  const todoTask = `URL Filter TODO ${Date.now()}`;
  const doneTask = `URL Filter DONE ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a TODO task
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(todoTask);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText(todoTask).first()).toBeVisible({ timeout: 5000 });

  // Create a DONE task
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(doneTask);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  // Change status to DONE
  await page.getByLabel(/status/i).click();
  await page.getByRole('option', { name: 'DONE' }).click();
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText(doneTask).first()).toBeVisible({ timeout: 5000 });

  // Navigate to Done filter via URL
  await page.goto('/?status=DONE');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify URL contains filter
  await expect(page).toHaveURL(/\?status=DONE/);
  
  // Verify only done task is visible (or at least the filter is applied)
  await expect(page.getByText(doneTask).first()).toBeVisible();

  // Refresh the page
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Verify filter still applied after refresh
  await expect(page).toHaveURL(/\?status=DONE/);
  await expect(page.getByText(doneTask).first()).toBeVisible();
  
  // The heading should show "Done"
  await expect(page.getByText('Done').first()).toBeVisible();

  // Clean up - both tasks
  await page.goto('/');
  await page.waitForTimeout(500);
  await cleanupTasks(page, [todoTask, doneTask]);
});
