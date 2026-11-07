import { test, expect } from "../setup/fixtures";
import { loginAsAdmin } from "../setup/auth";

test.describe("Gestion des articles", () => {
  test("devrait afficher les articles sur la page d'accueil", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.locator("main").first()).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible({
      timeout: 20000,
    });
  });

  test("devrait naviguer vers le détail d'un article", async ({ page }) => {
    await page.goto("/");

    // ArticleCard rend le lien comme parent de <article>.
    const firstArticle = page.locator('a[href^="/article/"]').first();
    await expect(firstArticle).toBeVisible({ timeout: 20000 });
    await firstArticle.click();

    await expect(page).toHaveURL(/\/article\/.+/);
    // La page de détail est chargée à la demande et attend l'article via l'API.
    await expect(page.locator(".prose-article")).toBeVisible({
      timeout: 25000,
    });
  });

  test("devrait afficher les catégories d'articles", async ({ page }) => {
    await page.goto("/");

    const badge = page
      .locator('a[href^="/article/"]')
      .first()
      .locator("span")
      .first();
    await expect(badge).toBeVisible({ timeout: 20000 });
    expect((await badge.innerText()).trim().length).toBeGreaterThan(0);
  });

  test.describe("Création d'article (admin)", () => {
    test("devrait accéder à l'éditeur d'article", async ({ page }) => {
      await loginAsAdmin(page);

      await page.goto("/admin/article/new");
      await expect(page).toHaveURL(/\/admin\/article\/new/);

      // L'éditeur est lazy-loadé derrière un spinner : on attend le premier
      // champ de saisie (titre ou contenu riche) au lieu de compter à froid.
      await expect(
        page
          .locator(
            'input#title, input[id="title"], textarea, [contenteditable="true"]'
          )
          .first()
      ).toBeVisible({ timeout: 30000 });
    });
  });
});
