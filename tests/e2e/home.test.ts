import { test, expect } from "../setup/fixtures";

/**
 * Sélecteurs alignés sur le DOM réel (SiteHeader, Home, SiteFooter).
 * Les anciennes assertions visaient des classes qui n'existent pas
 * (`.site-logo`, `.hero-section`, `.article-card`, `.newsletter-input`…).
 *
 * `waitForLoadState("networkidle")` est proscrit ici : le site sonde le
 * serveur en continu (notifications, compte à rebours), donc cet état
 * n'arrive jamais et le test échoue par timeout.
 */
test.describe("Page d'accueil", () => {
  test("affiche le header, le logo et le footer", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.locator(".g12-logo img")).toBeVisible();

    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });

  test("affiche les articles récents avec leur lien", async ({ page }) => {
    await page.goto("/");

    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
    expect(await cards.count()).toBeGreaterThan(0);

    // Le lien enveloppe la carte : `article` est le descendant, pas l'inverse.
    const firstCard = page.locator('a[href^="/article/"]').first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard).toHaveAttribute("href", /^\/article\/.+/);
    await expect(firstCard.locator("h3").first()).toBeVisible();
  });

  test("ouvre un article depuis l'accueil", async ({ page }) => {
    await page.goto("/");

    const link = page.locator('a[href^="/article/"]').first();
    await expect(link).toBeVisible({ timeout: 20000 });
    await link.click();

    await expect(page).toHaveURL(/\/article\/.+/);
    await expect(page.locator(".prose-article")).toBeVisible();
  });

  test("navigue vers Galeries depuis le header", async ({ page }) => {
    await page.goto("/");

    await page
      .locator('header nav a[href="/galeries"]:visible')
      .first()
      .click();

    await expect(page).toHaveURL(/\/galeries/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("expose le formulaire newsletter du footer", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await footer.scrollIntoViewIfNeeded();

    await expect(
      footer.locator('input[type="email"][name="email"]')
    ).toBeVisible();
    await expect(footer.locator('button[type="submit"]')).toBeVisible();
  });

  test("affiche le titre du document", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/G12 Paris/i);
  });

  test("ne défile pas horizontalement", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    );
    expect(overflow).toBe(0);
  });
});
