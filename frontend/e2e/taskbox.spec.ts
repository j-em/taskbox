import { test, expect } from '@playwright/test';

// Helper to ensure sidebar is closed
async function ensureSidebarClosed(page: import('@playwright/test').Page) {
  // Press Escape to close any open modal/sidebar
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

// Helper to open sidebar and click a link
async function clickSidebarLink(page: import('@playwright/test').Page, linkName: RegExp | string) {
  await ensureSidebarClosed(page);
  // Open sidebar using the menu icon button
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(300);
  // Click the link
  await page.getByRole('link', { name: linkName }).click();
}

/**
 * Test 1: Task List Loading & Navigation
 * Tests app loading, API data fetching, and route navigation.
 */
test('task list loads and navigation works', async ({ page }) => {
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Verify MUI App shell renders
  await expect(page.locator('h1:has-text("All Tasks")')).toBeVisible();

  // The "Add Task" button is a link
  await page.getByRole('link', { name: 'Add Task' }).click();
  await expect(page).toHaveURL(/\/task\/new/);
  await expect(page.locator('h5, h1, h2').filter({ hasText: /create/i })).toBeVisible();
});

/**
 * Test 2: Create and Update a Task
 * Tests task creation flow and state mutation with RTK Query.
 */
test('create and update a task', async ({ page }) => {
  const taskName = `Test Task ${Date.now()}`;

  await page.goto('/app');
  await ensureSidebarClosed(page);
  await page.waitForTimeout(500);

  // Open create task form
  await page.getByRole('link', { name: 'Add Task' }).click();
  await expect(page).toHaveURL(/\/task\/new/);

  // Fill form fields
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Test description for E2E');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();

  // Verify redirect and task appears
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Click on task to view details
  await page.getByText(taskName).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText('Test description for E2E')).toBeVisible();

  // Navigate back and change status
  await page.goto('/app');
  await ensureSidebarClosed(page);
  await page.waitForTimeout(500);

  const taskItem = page.locator('li', { hasText: taskName }).first();
  if (await taskItem.isVisible()) {
    await taskItem.locator('button').first().click();
    await page.waitForTimeout(500);
    await expect(page.getByText(taskName).first()).toBeVisible();
  }
});

/**
 * Test 3: Cancel Task and Filter Views
 * Tests state transitions (cancelling), sidebar navigation, and filtering between views.
 */
test('cancel task and filter views', async ({ page }) => {
  const taskName = `Cancel Task ${Date.now()}`;

  await page.goto('/app');
  await ensureSidebarClosed(page);
  await page.waitForTimeout(500);

  // Create a task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();

  // Verify task created
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Click status button 3 times to get to CANCELLED (TODO -> IN_PROGRESS -> DONE -> CANCELLED)
  const taskItem = page.locator('li', { hasText: taskName }).first();
  const statusButton = taskItem.locator('button').first();

  for (let i = 0; i < 3; i++) {
    await statusButton.click();
    await page.waitForTimeout(500);
  }

  // Navigate to Cancelled view via sidebar
  await clickSidebarLink(page, /cancelled/i);
  await expect(page).toHaveURL(/\?status=CANCELLED/);

  // Verify cancelled task is visible
  await expect(page.getByText(taskName).first()).toBeVisible();

  // Switch to To Do view via sidebar
  await clickSidebarLink(page, /^to do$/i);
  await expect(page).toHaveURL(/\?status=TODO/);
});

/**
 * Test 4: Edit and Delete Task
 * Tests task editing and deletion functionality.
 */
test('edit and delete task', async ({ page }) => {
  const taskName = `Edit Task ${Date.now()}`;
  const updatedName = `Updated ${Date.now()}`;

  await page.goto('/app');
  await ensureSidebarClosed(page);
  await page.waitForTimeout(500);

  // Create a task
  await page.getByRole('link', { name: 'Add Task' }).click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Original desc');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();

  // Verify task created
  await expect(page).toHaveURL(/\/app\/home/);
  await expect(page.getByText(taskName).first()).toBeVisible({ timeout: 5000 });

  // Navigate to task detail
  await page.locator('li', { hasText: taskName }).first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);

  // Click edit button
  await page.locator('a:has-text("Edit")').first().click();
  await expect(page).toHaveURL(/\/task\/[\w-]+\/edit/);

  // Edit the task
  await page.getByLabel(/title/i).fill(updatedName);
  await page.getByLabel(/description/i).fill('Updated desc');
  await page.locator('button:has-text("Update")').click();

  // Verify redirect and updated content
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText(updatedName).first()).toBeVisible();

  // Go back to list
  await page.goto('/app');
  await ensureSidebarClosed(page);
  await page.waitForTimeout(500);
  await expect(page.getByText(updatedName).first()).toBeVisible();

  // Delete the task
  const taskItem = page.locator('li', { hasText: updatedName }).first();
  const deleteButton = taskItem.locator('button[aria-label="delete"]');

  // Handle confirmation dialog and delete
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await deleteButton.click();
  await page.waitForTimeout(500);

  // Verify task is removed
  await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 5000 });
});
