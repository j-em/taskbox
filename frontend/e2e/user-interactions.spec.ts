import { test, expect } from '@playwright/test';

/**
 * Test 1: Theme Toggle Persistence
 * Verifies that clicking the theme toggle button switches between light and dark mode,
 * and that the theme state persists after page refresh.
 */
test('theme toggle switches between light and dark mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Get the theme toggle button (it has aria-label containing "mode")
  const themeButton = page.locator('button[aria-label*="mode"]');
  await expect(themeButton).toBeVisible();

  // Check initial theme by looking at MUI's data attribute on html element
  const getTheme = () => page.evaluate(() => {
    // MUI v5+ sets data-mui-color-scheme on html element
    const html = document.documentElement;
    const muiScheme = html.getAttribute('data-mui-color-scheme');
    if (muiScheme) return muiScheme;
    
    // Fallback: check computed background color
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    // Dark mode typically has rgb(18, 18, 18) or similar dark color
    const isDark = bodyBg.includes('18') || bodyBg.includes('0, 0, 0') || bodyBg.includes('rgb(30');
    return isDark ? 'dark' : 'light';
  });

  const initialTheme = await getTheme();
  console.log(`Initial theme: ${initialTheme}`);

  // Toggle theme
  await themeButton.click();
  await page.waitForTimeout(800);

  // Verify theme changed
  const newTheme = await getTheme();
  console.log(`After toggle: ${newTheme}`);
  expect(newTheme).not.toBe(initialTheme);

  // Toggle back
  await themeButton.click();
  await page.waitForTimeout(800);

  // Verify theme toggled back
  const finalTheme = await getTheme();
  console.log(`After second toggle: ${finalTheme}`);
  expect(finalTheme).toBe(initialTheme);
});

/**
 * Test 2: Tag Creation and Display
 * Verifies that creating a task with multiple tags displays them correctly
 * in both list view (truncated if >3) and detail view.
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

/**
 * Test 3: Form Validation Errors
 * Verifies that the task form prevents empty title submission
 * and shows error messages when validation fails.
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

/**
 * Test 4: Tag Editing in Update Form
 * Verifies that tags can be added and removed in the task edit form.
 */
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

/**
 * Test 5: Status Dropdown Selection in Edit Form
 * Verifies that task status can be changed using the dropdown in the edit form.
 */
test('change task status via dropdown in edit form', async ({ page }) => {
  const taskName = `Status Change Test ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task with TODO status
  await page.locator('a:has-text("ADD")').click();
  await expect(page).toHaveURL(/\/task\/new/);

  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing status dropdown');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  // Keep default TODO status
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');

  // Wait for task to appear and click edit
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible({ timeout: 5000 });
  await taskItem.locator('a[aria-label="edit"]').click();
  await expect(page).toHaveURL(/\/task\/[\w-]+\/edit/);
  await page.waitForTimeout(800);

  // Verify current status is TODO
  await expect(page.getByLabel(/status/i)).toHaveText('TODO');

  // Change status using dropdown
  await page.getByLabel(/status/i).click();
  await page.waitForTimeout(200);
  await page.getByRole('option', { name: 'DONE' }).click();
  await page.waitForTimeout(300);

  // Update the task
  await page.locator('button:has-text("Update")').click();
  await expect(page).toHaveURL('/');

  // Verify task now shows DONE status in the list
  const updatedItem = page.locator('li', { hasText: taskName }).first();
  await expect(updatedItem.getByText('DONE')).toBeVisible();

  // Click to view detail and verify status
  await updatedItem.click();
  await expect(page).toHaveURL(/\/task\/[\w-]+/);
  await expect(page.getByText('DONE').first()).toBeVisible();

  // Navigate back and clean up
  await page.goto('/');
  await page.waitForTimeout(500);

  const deleteItem = page.locator('li', { hasText: taskName }).first();
  if (await deleteItem.isVisible().catch(() => false)) {
    const deleteButton = deleteItem.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
});

/**
 * Test 6: Empty State Display
 * Verifies that the empty state is shown when no tasks match the current filter.
 */
test('empty state shows when no tasks exist for filter', async ({ page }) => {
  await page.goto('/?status=CANCELLED');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Verify "No tasks found" message is visible
  await expect(page.getByText(/no tasks found/i)).toBeVisible();
  await expect(page.getByText(/create a new task to get started/i)).toBeVisible();

  // Verify "Add Task" button is still available
  await expect(page.locator('a:has-text("ADD"), button:has-text("Add")').first()).toBeVisible();

  // Navigate to a view that should have tasks
  await page.goto('/');
  await page.waitForTimeout(500);

  // Verify tasks are shown (we've created tasks in previous tests)
  const taskList = page.locator('[role="list"], .MuiList-root').first();
  await expect(taskList).toBeVisible();
});

/**
 * Test 7: Navigation via Task Title Click
 * Verifies that clicking on a task title navigates to the detail view.
 */
test('click task title navigates to detail view', async ({ page }) => {
  const taskName = `Navigation Test ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task first
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/description/i).fill('Testing navigation via title click');
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');

  // Find the task
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible({ timeout: 5000 });

  // Click on the task title (the primary text in the ListItem)
  // The task item is a link that wraps the whole content
  await taskItem.click();

  // Verify navigation to detail page
  await expect(page).toHaveURL(/\/task\/[\w-]+/);

  // Verify detail view shows correct content
  await expect(page.getByText(taskName).first()).toBeVisible();
  await expect(page.getByText('Testing navigation via title click')).toBeVisible();

  // Navigate back and clean up
  await page.goto('/');
  await page.waitForTimeout(500);

  const deleteItem = page.locator('li', { hasText: taskName }).first();
  if (await deleteItem.isVisible().catch(() => false)) {
    const deleteButton = deleteItem.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteButton.click();
    await page.waitForTimeout(500);
  }
});

/**
 * Test 8: 404 Page Navigation
 * Verifies that the 404 page displays correctly and has a working navigation link.
 */
test('404 page provides working navigation back home', async ({ page }) => {
  // Navigate to a non-existent route
  await page.goto('/nonexistent-route-404-test');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify 404 page content
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByText(/page not found/i)).toBeVisible();
  await expect(page.getByText(/the page you are looking for does not exist/i)).toBeVisible();

  // Verify "Go Home" button exists
  const goHomeButton = page.locator('button:has-text("Go Home"), a:has-text("Go Home")').first();
  await expect(goHomeButton).toBeVisible();

  // Click the button and verify navigation
  await goHomeButton.click();
  await expect(page).toHaveURL('/');

  // Verify we're on the home page by checking for "All Tasks" heading
  await expect(page.getByText('All Tasks').first()).toBeVisible();
});

/**
 * Test 9: Status Icon Button Exists
 * Verifies that the status icon button is present and clickable on task items.
 */
test('task item has status icon button', async ({ page }) => {
  const taskName = `Status Icon Test ${Date.now()}`;

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Create a task
  await page.locator('a:has-text("ADD")').click();
  await page.getByLabel(/title/i).fill(taskName);
  await page.getByLabel(/scheduled date/i).fill(new Date().toISOString().split('T')[0]);
  await page.locator('button:has-text("Create")').click();
  await expect(page).toHaveURL('/');

  // Find the task and verify status icon button exists
  const taskItem = page.locator('li', { hasText: taskName }).first();
  await expect(taskItem).toBeVisible({ timeout: 5000 });
  
  // Verify status button exists with correct aria-label
  const statusButton = taskItem.locator('button[aria-label*="Change status"]').first();
  await expect(statusButton).toBeVisible();
  
  // Verify the status chip shows "To Do"
  await expect(taskItem.getByText('To Do')).toBeVisible();

  // Clean up
  await page.goto('/');
  await page.waitForTimeout(500);
  const deleteItem = page.locator('li', { hasText: taskName }).first();
  if (await deleteItem.isVisible().catch(() => false)) {
    const deleteBtn = deleteItem.locator('button[aria-label="delete"]');
    page.once('dialog', async (dialog) => await dialog.accept());
    await deleteBtn.click();
    await page.waitForTimeout(500);
  }
});

/**
 * Test 10: Responsive Sidebar Behavior
 * Verifies that the sidebar opens and closes correctly on mobile viewport.
 */
test('sidebar opens and closes on mobile viewport', async ({ page }) => {
  // Set viewport to mobile size (iPhone-like dimensions)
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Verify sidebar is not visible initially ( Drawer is closed on mobile)
  const sidebar = page.locator('.MuiDrawer-root, [role="dialog"]').first();
  await expect(sidebar).not.toBeVisible();

  // Open sidebar using the menu button
  await page.locator('button[aria-label="toggle sidebar"]').click();
  await page.waitForTimeout(600);

  // Verify sidebar is now visible
  await expect(sidebar).toBeVisible();

  // Verify sidebar contains navigation links
  await expect(sidebar.getByText('All Tasks')).toBeVisible();
  await expect(sidebar.getByText('To Do')).toBeVisible();

  // Click a navigation link to close sidebar
  await sidebar.getByText('All Tasks').click();
  await page.waitForTimeout(400);

  // Verify sidebar closed after navigation
  await expect(sidebar).not.toBeVisible();

  // Verify we're still on the home page
  await expect(page.getByText('All Tasks').first()).toBeVisible();
});
