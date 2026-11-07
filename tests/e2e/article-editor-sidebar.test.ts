import "dotenv/config";
import type { Page } from "@playwright/test";
import { test, expect } from "../setup/fixtures";

/**
 * La sidebar de l'éditeur d'article vit dans une grille
 * `lg:grid-cols-[1fr_340px]`. Un enfant de grille conserve
 * `min-width: auto` : un contenu insécable (sélecteur IA, URL longue)
 * élargit la piste au-delà des 340px et fait apparaître un scroll
 * horizontal de page. Ces tests figent l'absence de débordement.
 */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function openEditorSidebar(page: Page) {
  await page.goto("/admin/article/new");
  const sidebar = page.locator('[class*="lg:top-20"]').first();
  await sidebar.waitFor({ state: "visible", timeout: 25000 });
  return sidebar;
}

test.describe("Éditeur d'article — sidebar sans débordement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Sans mot de passe admin valide, le rendu de l'éditeur est
    // inaccessible : on ignore explicitement plutôt que d'échouer.
    const loggedIn = await page
      .waitForURL("**/admin", { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    test.skip(
      !loggedIn,
      "Authentification admin indisponible : ADMIN_PASSWORD ne correspond pas à ce serveur"
    );
  });

  const viewports = [
    { label: "desktop", width: 1440, height: 900 },
    { label: "mobile", width: 375, height: 812 },
  ];

  for (const viewport of viewports) {
    test(`pas de scroll horizontal en ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      const sidebar = await openEditorSidebar(page);

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const panel = document.querySelector('[class*="lg:top-20"]');
        const cards = panel ? [...panel.querySelectorAll(".bg-card")] : [];

        return {
          pageOverflowX: root.scrollWidth - root.clientWidth,
          cardCount: cards.length,
          overflowingCards: cards
            .filter(card => card.scrollWidth > card.clientWidth + 1)
            .map(card => (card.textContent || "").trim().slice(0, 40)),
        };
      });

      expect(metrics.pageOverflowX).toBe(0);
      // Garde-fou : sans carte, l'assertion suivante passerait à vide.
      expect(metrics.cardCount).toBeGreaterThan(0);
      expect(metrics.overflowingCards).toEqual([]);
      await expect(sidebar).toBeVisible();
    });
  }
});
