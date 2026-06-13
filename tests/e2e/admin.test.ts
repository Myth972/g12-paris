import { test, expect } from '../setup/fixtures';

test.describe('Administration', () => {
  test('devrait être redirigé vers login sans authentification', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('devrait afficher le tableau de bord admin après connexion', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('devrait afficher les onglets de navigation admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    await page.waitForLoadState('networkidle');

    const tabs = page.locator('[role="tab"], button:has-text("Articles"), button:has-text("Accueil"), button:has-text("Newsletter")');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThanOrEqual(1);
  });

  test('devrait permettre de naviguer vers la bibliothèque admin', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    await page.goto('/admin/bibliotheque');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/admin\/bibliotheque/);
  });
});
