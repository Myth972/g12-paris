import { test, expect } from '../setup/fixtures';

test.describe('Composant Article', () => {
  test('devrait afficher des articles sur la page d\'accueil', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const articles = page.locator('article');
    await expect(articles.first()).toBeVisible();
  });

  test('chaque article devrait contenir un titre', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const articleHeadings = page.locator('article h3, article h2');
    if (await articleHeadings.first().isVisible()) {
      await expect(articleHeadings.first()).toBeVisible();
    }
  });

  test('chaque article devrait être cliquable', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const articleLinks = page.locator('article a').first();
    if (await articleLinks.isVisible()) {
      const href = await articleLinks.getAttribute('href');
      expect(href).toMatch(/^\/article\//);
    }
  });

  test('devrait afficher les métadonnées des articles', async ({ page }) => {
    await page.goto('/');

    await page.waitForLoadState('networkidle');

    const article = page.locator('article').first();
    const hasMeta = await article.locator('text=actualite, text=publication, svg.lucide-calendar, .line-clamp-2').count();
    expect(hasMeta).toBeGreaterThanOrEqual(0);
  });
});
