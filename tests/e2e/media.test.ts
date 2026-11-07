import { test, expect } from "../setup/fixtures";

/**
 * Ces tests ne vérifiaient que l'URL : une page blanche les passait.
 * On attend désormais le rendu réel (`main`) et plus `networkidle`,
 * que le polling du site empêche d'atteindre.
 */
const PAGES = [
  { path: "/galeries", label: "galeries" },
  { path: "/bibliotheque", label: "bibliothèque" },
  { path: "/bibliotheque/catalogue", label: "catalogue" },
  { path: "/bibliotheque/themes", label: "thèmes bibliques" },
  { path: "/bibliotheque/offres", label: "offres et packs" },
  { path: "/bibliotheque/etude", label: "études" },
];

test.describe("Pages médias et bibliothèque", () => {
  for (const item of PAGES) {
    test(`affiche la page ${item.label}`, async ({ page }) => {
      await page.goto(item.path);

      await expect(page).toHaveURL(new RegExp(item.path));
      await expect(page.locator("main").first()).toBeVisible();
      await expect(page.locator("header")).toBeVisible();
    });
  }
});
