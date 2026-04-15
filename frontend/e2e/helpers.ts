import { type Page } from '@playwright/test';

/**
 * Helper to clean up tasks by name
 */
export async function cleanupTasks(page: Page, taskNames: string[]) {
  await page.goto('/');
  await page.waitForTimeout(500);
  for (const taskName of taskNames) {
    const item = page.locator('li', { hasText: taskName }).first();
    if (await item.isVisible().catch(() => false)) {
      const deleteButton = item.locator('button[aria-label="delete"]');
      page.once('dialog', async (dialog) => await dialog.accept());
      await deleteButton.click();
      await page.waitForTimeout(300);
    }
  }
}
