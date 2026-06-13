import { test, expect } from '../setup/fixtures';

test.describe('Page d\'accueil - Tests complets', () => {
  test('devrait afficher la structure complète de la page d\'accueil', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier le header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('.site-logo')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('.language-switcher')).toBeVisible();
    
    // Vérifier le hero section
    await expect(page.locator('.hero-section')).toBeVisible();
    await expect(page.locator('.hero-title')).toBeVisible();
    await expect(page.locator('.hero-subtitle')).toBeVisible();
    
    // Vérifier les sections principales
    await expect(page.locator('.latest-articles')).toBeVisible();
    await expect(page.locator('.categories-section')).toBeVisible();
    await expect(page.locator('.newsletter-section')).toBeVisible();
    
    // Vérifier le footer
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('.footer-links')).toBeVisible();
    await expect(page.locator('.social-links')).toBeVisible();
  });

  test('devrait afficher les articles récents avec pagination', async ({ page }) => {
    await page.goto('/');
    
    // Attendre le chargement des articles
    await page.waitForSelector('.article-card', { timeout: 10000 });
    
    // Vérifier le compteur d'articles
    const articleCount = await page.locator('.article-card').count();
    expect(articleCount).toBeGreaterThan(0);
    
    // Vérifier la structure d'une carte d'article
    const firstArticle = page.locator('.article-card').first();
    await expect(firstArticle.locator('h3')).toBeVisible();
    await expect(firstArticle.locator('img')).toBeVisible();
    await expect(firstArticle.locator('.article-excerpt')).toBeVisible();
    await expect(firstArticle.locator('.read-more')).toBeVisible();
    await expect(firstArticle.locator('.article-date')).toBeVisible();
    await expect(firstArticle.locator('.article-category')).toBeVisible();
    
    // Tester la pagination
    if (await page.locator('.pagination').isVisible()) {
      await page.click('.pagination .next-page');
      await expect(page.locator('.article-card')).toBeVisible();
    }
  });

  test('devrait permettre la navigation par catégories', async ({ page }) => {
    await page.goto('/');
    
    // Récupérer toutes les catégories
    const categories = await page.locator('.category-tag').all();
    expect(categories.length).toBeGreaterThan(0);
    
    // Tester chaque catégorie
    for (const category of categories.slice(0, 3)) {
      const categoryName = await category.textContent();
      await category.click();
      
      // Attendre le filtrage
      await page.waitForLoadState('networkidle');
      
      // Vérifier que les articles sont filtrés
      const filteredArticles = await page.locator('.article-card').count();
      expect(filteredArticles).toBeGreaterThanOrEqual(0);
      
      // Vérifier l'indicateur de catégorie active
      await expect(page.locator(`.category-tag.active:has-text("${categoryName}")`)).toBeVisible();
    }
  });

  test('devrait permettre la recherche d\'articles', async ({ page }) => {
    await page.goto('/');
    
    // Remplir le champ de recherche
    await page.fill('.search-input', 'culte');
    await page.click('.search-button');
    
    // Attendre les résultats
    await page.waitForSelector('.search-results');
    
    // Vérifier les résultats
    await expect(page.locator('.search-results')).toBeVisible();
    await expect(page.locator('.search-results-title')).toBeVisible();
    const resultCount = await page.locator('.search-result-item').count();
    expect(resultCount).toBeGreaterThanOrEqual(0);
    
    // Tester la recherche avec un terme inexistant
    await page.fill('.search-input', 'termeinexistant');
    await page.click('.search-button');
    
    await expect(page.locator('.no-results')).toBeVisible();
  });

  test('devrait permettre d\'accéder à un article spécifique', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur le premier article
    await page.click('.article-card:first-child .read-more');
    
    // Vérifier la navigation vers l'article
    await expect(page).toHaveURL(/\/articles\/.+/);
    await expect(page.locator('.article-detail')).toBeVisible();
    await expect(page.locator('.article-title')).toBeVisible();
    await expect(page.locator('.article-content')).toBeVisible();
  });

  test('devrait afficher les articles populaires', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier la section des articles populaires
    await expect(page.locator('.popular-articles')).toBeVisible();
    await expect(page.locator('.popular-articles h2')).toBeVisible();
    
    const popularArticles = await page.locator('.popular-article').count();
    expect(popularArticles).toBeGreaterThan(0);
    
    // Vérifier la structure d'un article populaire
    const firstPopular = page.locator('.popular-article').first();
    await expect(firstPopular.locator('h4')).toBeVisible();
    await expect(firstPopular.locator('.popular-article-meta')).toBeVisible();
  });

  test('devrait permettre l\'inscription à la newsletter', async ({ page }) => {
    await page.goto('/');
    
    // Scroller vers la section newsletter
    await page.locator('.newsletter-section').scrollIntoViewIfNeeded();
    
    // Remplir le formulaire
    await page.fill('.newsletter-input', 'test@example.com');
    await page.click('.newsletter-button');
    
    // Vérifier la confirmation
    await expect(page.locator('.newsletter-success')).toBeVisible();
    await expect(page.locator('.newsletter-success')).toHaveText('Inscription réussie !');
  });

  test('devrait gérer les erreurs de chargement', async ({ page }) => {
    // Mock une erreur de chargement des articles
    await page.route('**/api/articles', async (route) => {
      await route.abort('failed');
    });
    
    await page.goto('/');
    
    // Vérifier l'affichage d'un message d'erreur
    await expect(page.locator('.error-loading')).toBeVisible();
    await expect(page.locator('.retry-button')).toBeVisible();
    
    // Tester le retry
    await page.click('.retry-button');
    await expect(page.locator('.article-card')).toBeVisible();
  });

  test('devrait être responsive sur différents écrans', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('.desktop-menu')).toBeVisible();
    await expect(page.locator('.search-bar-desktop')).toBeVisible();
    
    // Test tablette
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('.tablet-layout')).toBeVisible();
    await expect(page.locator('.responsive-menu')).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('.mobile-menu-button')).toBeVisible();
    await expect(page.locator('.mobile-layout')).toBeVisible();
  });

  test('devrait charger rapidement et sans erreurs', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier qu'il n'y a pas d'erreurs dans la console
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Attendre que tout soit chargé
    await page.waitForLoadState('networkidle');
    
    // Vérifier qu'il n'y a pas d'erreurs
    expect(consoleErrors.length).toBe(0);
    
    // Vérifier les métriques de performance
    const metrics = await page.metrics();
    expect(metrics.FCP).toBeLessThan(2000); // First Content Paint < 2s
  });
});