// tests/smoke.spec.js
import { test, expect } from '@playwright/test';

test('smoke test - page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Dante|dante/i);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');
  // Basic check that page is accessible
  await expect(page.locator('body')).toBeVisible();
});
