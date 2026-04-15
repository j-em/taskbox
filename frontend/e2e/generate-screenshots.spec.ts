import { test, expect, Page } from '@playwright/test';
import type { Task } from '../src/types';

// Viewport sizes based on Tailwind CSS default breakpoints
// Mobile: below sm (640px) - using iPhone 14 dimensions
// Tablet: md breakpoint (768px) - using iPad mini dimensions
// Desktop: xl breakpoint (1280px) - standard laptop
const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

type ViewportName = keyof typeof VIEWPORTS;
type ThemeMode = 'light' | 'dark';

// Output directory for screenshots
const SCREENSHOT_DIR = 'screenshots';

/**
 * Helper to ensure sidebar is closed before taking screenshots
 */
async function ensureSidebarClosed(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
}

/**
 * Helper to toggle theme between light and dark
 * Finds the theme toggle button by looking for the icon button in the AppBar
 */
async function toggleTheme(page: Page, currentMode: ThemeMode): Promise<ThemeMode> {
  // Find the theme toggle button by its aria-label pattern (contains "mode")
  const themeButton = page.locator('button[aria-label*="mode"]');
  await themeButton.click();
  await page.waitForTimeout(500);
  return currentMode === 'light' ? 'dark' : 'light';
}

/**
 * Helper to set viewport size
 */
async function setViewport(page: Page, viewportName: ViewportName) {
  const size = VIEWPORTS[viewportName];
  await page.setViewportSize(size);
  await page.waitForTimeout(300);
}

/**
 * Helper to take a screenshot with proper naming
 */
async function takeScreenshot(page: Page, viewName: string, theme: ThemeMode, viewport: ViewportName) {
  await ensureSidebarClosed(page);
  const screenshotPath = `${SCREENSHOT_DIR}/${viewName}/${theme}/${viewport}.png`;
  await page.screenshot({ 
    path: screenshotPath,
    fullPage: false
  });
  console.log(`📸 Screenshot: ${screenshotPath}`);
}

/**
 * Helper to create a task via API for screenshot testing
 */
async function createTask(baseURL: string): Promise<Task> {
  const taskData = {
    title: 'Screenshot Sample Task',
    description: 'This is a sample task for screenshot generation. It demonstrates the task detail view with all the information displayed properly.',
    scheduledDate: new Date().toISOString().split('T')[0],
    tags: ['demo', 'screenshot'],
    status: 'IN_PROGRESS',
  };

  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  const response = await fetch(`${apiUrl}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create task: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Helper to delete a task via API
 */
async function deleteTask(taskId: string) {
  const apiUrl = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';
  await fetch(`${apiUrl}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

test.describe.configure({ mode: 'serial' });

test('generate screenshots for all views, themes, and viewports', async ({ page, baseURL }) => {
  // Ensure baseURL is available
  const url = baseURL || 'http://localhost:5173';
  
  // Create a sample task for detail and edit screenshots
  let sampleTask: Task | null = null;
  try {
    sampleTask = await createTask(url);
  } catch (e) {
    console.warn('Could not create task via API, screenshots will skip task detail/edit:', e);
  }

  // Define all views to screenshot
  const views: Array<{ name: string; path: string; setup?: () => Promise<void> }> = [
    { name: 'home-all', path: '/' },
    { name: 'home-todo', path: '/?status=TODO' },
    { name: 'task-create', path: '/task/new' },
  ];

  // Add task detail and edit views only if we created a task
  if (sampleTask) {
    views.push(
      { name: 'task-detail', path: `/task/${sampleTask.id}` },
      { name: 'task-edit', path: `/task/${sampleTask.id}/edit` }
    );
  }

  // Add 404 page
  views.push({ name: 'not-found', path: '/nonexistent-route-for-404' });

  let currentTheme: ThemeMode = 'light';

  for (const view of views) {
    await test.step(`Capturing screenshots for ${view.name}`, async () => {
      // Navigate to the view
      await page.goto(view.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(800);

      // Check current theme and reset to light if needed
      const isDarkMode = await page.evaluate(() => {
        return document.body.classList.contains('dark') || 
               document.documentElement.style.getPropertyValue('color-scheme') === 'dark';
      });
      
      if (isDarkMode) {
        await toggleTheme(page, 'dark');
        currentTheme = 'light';
      }

      // Capture all viewports in light mode
      for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
        await setViewport(page, viewport);
        await takeScreenshot(page, view.name, 'light', viewport);
      }

      // Switch to dark mode
      currentTheme = await toggleTheme(page, currentTheme);

      // Capture all viewports in dark mode
      for (const viewport of Object.keys(VIEWPORTS) as ViewportName[]) {
        await setViewport(page, viewport);
        await takeScreenshot(page, view.name, 'dark', viewport);
      }

      // Switch back to light for next view
      currentTheme = await toggleTheme(page, currentTheme);
    });
  }

  // Cleanup: delete the sample task
  if (sampleTask) {
    await deleteTask(sampleTask.id);
  }
});
