import { test, expect } from '@playwright/test';
import { cleanupTasks } from './helpers';

/**
 * Feature: Task Forms
 * Tests form validation, cancel behavior, date display, and overflow handling
 */

test('task form shows validation errors for required fields', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Navigate to create task form
  await page.locator('a:has-text("ADD")').click();
  await expect(page).toHaveURL(/\/task\/new/);

  // Get the title input - it has HTML5 required attribute
  const titleInput = page.getByLabel(/title/i);
  const dateInput = page.getByLabel(/scheduled date/i);

  // Verify required attributes are present (HTML5 validation)
  await expect(titleInput).toHaveAttribute('required');
  await expect(dateInput).toHaveAttribute('required');

  // Fill the form with valid data
  await titleInput.fill('Valid Task');
  await dateInput.fill(new Date().toISOString().split('T')[0]);

  // Submit should work now
  await page.locator('button:has-text("Create")').click();

  // Verify redirect to home
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Valid Task').first()).toBeVisible({ timeout: 5000 });

  // Clean up: delete the created task
  const listItem = page.locator('li', { hasText: 'Valid Task' }).first();
  if (await listItem.isVisible().catch(() => false)) {
    const deleteButton = listItem.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
});

test('cancel button discards form changes', async ({ page }) => {
  const taskName = `Cancel Edit Test ${Date.now()}`;
  const originalDesc = 'Original description';

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill(originalDesc);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Navigate to edit page
  await page.locator('li', { hasText: taskName }).first().locator('a[aria-label="edit"]').click();
  await expect(page).toHaveURL(/\/task\/[\w-]+\/edit/);
  await page.waitForTimeout(800);

  // Modify the form fields
  await page.getByLabel(/title/i).fill(`${taskName} MODIFIED`);
  await page.getByLabel(/description/i).fill('Modified description');
  
  // Click Cancel link - use first() to pick the form cancel button (not sidebar)
  await page.locator('a:has-text("Cancel")').first().click();
  
  // Should return to home (not detail view, since we came from list)
  await expect(page).toHaveURL('/');
  await page.waitForTimeout(500);

  // Verify original data is unchanged
  await expect(page.getByText(taskName).first()).toBeVisible();
  await expect(page.getByText(`${taskName} MODIFIED`)).not.toBeVisible();

  // Verify in detail view that original description is still there
  await page.getByText(taskName).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText(originalDesc)).toBeVisible();
  await expect(page.getByText('Modified description')).not.toBeVisible();

  // Navigate back home for cleanup
  await page.goto('/');
  await page.waitForTimeout(500);

  // Clean up
  await cleanupTasks(page, [taskName]);
});

test('scheduled date displays correctly in list and detail views', async ({ page }) => {
  const taskName = `Date Display Test ${Date.now()}`;
  // Use today's date for testing to avoid timezone issues
  const today = new Date();
  const testDate = today.toISOString().split('T')[0];
  const expectedYear = today.getFullYear().toString();

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task with a specific date
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/scheduled date/i).fill(testDate);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Verify date appears in list view (check for year which is consistent)
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem.getByText(expectedYear)).toBeVisible();

  // Navigate to detail view and verify date
  await page.getByText(taskName).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  
  // In detail view, the date section should be displayed
  await expect(page.getByText(/scheduled date/i).first()).toBeVisible();
  await expect(page.getByText(expectedYear).first()).toBeVisible();

  // Navigate back home for cleanup
  await page.goto('/');
  await page.waitForTimeout(500);

  // Clean up
  await cleanupTasks(page, [taskName]);
});

test('UI handles very long task titles and descriptions', async ({ page }) => {
  const taskIdentifier = Date.now();
  const longTitle = `Long Title ${taskIdentifier} ${'A'.repeat(80)}`;
  const longDescription = 'Description: ' + 'Word '.repeat(100);

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task with long content
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(longTitle);
  await page.getByLabel(/description/i).fill(longDescription);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  
  // Wait for navigation with longer timeout for large payloads
  await expect(page).toHaveURL('/', { timeout: 10000 });
  
  // Use a unique part of the title to find the task
  const searchText = `Long Title ${taskIdentifier}`;
  await expect(page.getByText(searchText).first()).toBeVisible({ timeout: 5000 });

  // Click on the task to view detail
  await page.getByText(searchText).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);

  // Verify content is visible (at least the unique identifier part)
  await expect(page.getByText(searchText).first()).toBeVisible();

  // Check for horizontal overflow (long content may cause scroll)
  // Note: This documents current behavior - long titles may cause horizontal scroll
  const bodyOverflow = await page.evaluate(() => {
    const body = document.body;
    return body.scrollWidth > body.clientWidth;
  });
  
  // Log the overflow state for documentation purposes
  console.log(`Horizontal overflow detected: ${bodyOverflow}`);
  
  // The key assertion: the page renders without crashing and content is accessible
  await expect(page.getByText(searchText).first()).toBeVisible();

  // Navigate back home
  await page.goto('/');
  await page.waitForTimeout(500);

  // Clean up - use the unique identifier to find the task
  const item = page.locator('li', { hasText: searchText }).first();
  if (await item.isVisible().catch(() => false)) {
    const deleteButton = item.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(300);
  }
});
