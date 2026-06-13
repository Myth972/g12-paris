import { test, expect } from '../setup/fixtures';

test.describe('Composant Header', () => {
  test('devrait afficher le header sur la page d\'accueil', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
  });

  test('devrait contenir le logo', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('header img[alt*="G12"], .g12-logo')).toBeVisible();
  });

  test('devrait contenir les liens de navigation', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const navLinks = page.locator('header nav a, header a[href="/"], header a[href*="publication"]');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('devrait naviguer via les liens du header', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const galeriesLink = page.locator('header a[href="/galeries"], a:has-text("Galeries")').first();
    if (await galeriesLink.isVisible()) {
      await galeriesLink.click();
      await expect(page).toHaveURL(/\/galeries/);
    }
  });
});
