import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('page loads successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page title is correct
    await expect(page).toHaveTitle(/Create Next App/);
  });

  test('renders main heading', async ({ page }) => {
    await page.goto('/');
    
    // Check that the main heading is visible
    const heading = page.getByRole('heading', {
      name: /to get started, edit the page.tsx file/i,
    });
    await expect(heading).toBeVisible();
  });

  test('renders navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check that deploy and docs links are visible
    const deployLink = page.getByRole('link', { name: /deploy now/i });
    const docsLink = page.getByRole('link', { name: /documentation/i });
    
    await expect(deployLink).toBeVisible();
    await expect(docsLink).toBeVisible();
  });
});
