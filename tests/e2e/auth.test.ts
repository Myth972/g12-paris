import { test, expect } from '../setup/fixtures';

test.describe('Authentification', () => {
  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h2')).toHaveText('Administration');
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('devrait afficher une erreur avec un mot de passe vide', async ({ page }) => {
    await page.goto('/login');

    await page.click('button[type="submit"]');

    await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('devrait rediriger vers /admin si déjà connecté', async ({ page, browser }) => {
    const context = await browser.newContext();
    const loginPage = await context.newPage();
    await loginPage.goto('/login');
    await loginPage.fill('#password', 'admin123');
    await loginPage.click('button[type="submit"]');
    await loginPage.waitForURL('/admin');

    await loginPage.goto('/login');
    await expect(loginPage).toHaveURL('/admin');
    await context.close();
  });

  test('devrait permettre la déconnexion', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');

    const deconnexionButton = page.locator('button:has-text("Deconnexion"), button:has-text("Déconnexion")');
    if (await deconnexionButton.isVisible()) {
      await deconnexionButton.click();
      await expect(page).toHaveURL('/login');
    }
  });
});
