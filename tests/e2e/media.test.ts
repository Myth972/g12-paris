import { test, expect } from '../setup/fixtures';

test.describe('Gestion des médias', () => {
  test('devrait afficher la page galeries', async ({ page }) => {
    await page.goto('/galeries');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/galeries/);
  });

  test('devrait afficher la page bibliothèque', async ({ page }) => {
    await page.goto('/bibliotheque');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/bibliotheque/);
  });

  test('devrait naviguer vers le catalogue bibliothèque', async ({ page }) => {
    await page.goto('/bibliotheque/catalogue');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/bibliotheque\/catalogue/);
  });

  test('devrait naviguer vers les thèmes bibliques', async ({ page }) => {
    await page.goto('/bibliotheque/themes');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/bibliotheque\/themes/);
  });

  test('devrait naviguer vers les offres et packs', async ({ page }) => {
    await page.goto('/bibliotheque/offres');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/bibliotheque\/offres/);
  });

  test('devrait naviguer vers les études', async ({ page }) => {
    await page.goto('/bibliotheque/etude');

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/bibliotheque\/etude/);
  });
});
