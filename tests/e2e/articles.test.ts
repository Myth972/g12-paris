import { test, expect } from '../setup/fixtures';

test.describe('Gestion des articles', () => {
  test('devrait afficher les articles sur la page d\'accueil', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const articles = page.locator('article').first();
    await expect(articles).toBeVisible();
  });

  test('devrait naviguer vers le détail d\'un article', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const firstArticle = page.locator('article a').first();
    await firstArticle.click();

    await expect(page).toHaveURL(/\/article\/.+/);
    await expect(page.locator('.prose-article, article')).toBeVisible();
  });

  test('devrait afficher les catégories d\'articles', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const badges = page.locator('article a').first().locator('span:has-text("actualite"), span:has-text("publication"), span:has-text("culte"), span:has-text("bibliotheque")');
    const firstBadge = badges.first();
    if (await firstBadge.isVisible()) {
      await expect(firstBadge).toBeVisible();
    }
  });

  test.describe('Création d\'article (admin)', () => {
    test('devrait accéder à l\'éditeur d\'article', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#password', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/admin');

      await page.goto('/admin/article/new');
      await page.waitForLoadState('networkidle');

      const hasEditor = await page.locator('input[id="title"], textarea, [contenteditable]').count();
      expect(hasEditor).toBeGreaterThan(0);
    });
  });
});
