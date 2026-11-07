import type { Page } from "@playwright/test";
import { test, expect } from "../setup/fixtures";

/**
 * Le contenu d'article est rendu par Streamdown dans `.prose-article`, sans
 * wrapper scrollable autour des tableaux. Un tableau à cellules insécables
 * élargissait donc la piste `1fr` de la grille et faisait défiler la page
 * entière horizontalement. Ces tests injectent un tel tableau pour figer le
 * comportement attendu : la page reste fixe, le tableau défile dans son cadre.
 */
const WIDE_TABLE_MARKUP =
  "<tbody><tr>" +
  Array.from(
    { length: 4 },
    (_, i) =>
      `<td style="white-space:nowrap">Cellule ${i} — 123456789012345678901234567890</td>`
  ).join("") +
  "</tr></tbody>";

async function openFirstArticle(page: Page) {
  await page.goto("/");
  const firstLink = page.locator('a[href^="/article/"]').first();
  await expect(firstLink).toBeVisible({ timeout: 20000 });

  const href = await firstLink.getAttribute("href");
  if (!href)
    throw new Error("Aucun lien d'article trouvé sur la page d'accueil");

  await page.goto(href);
  await page
    .locator(".prose-article")
    .waitFor({ state: "visible", timeout: 25000 });
}

test.describe("Article — tableau large sans débordement de page", () => {
  const viewports = [
    { label: "mobile", width: 375, height: 812 },
    { label: "desktop", width: 1280, height: 900 },
  ];

  for (const viewport of viewports) {
    test(`la page ne défile pas horizontalement en ${viewport.label}`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await openFirstArticle(page);

      const metrics = await page.evaluate((markup: string) => {
        const root = document.documentElement;
        const prose = document.querySelector(".prose-article");
        if (!prose) return null;

        const table = document.createElement("table");
        table.innerHTML = markup;
        prose.appendChild(table);

        const overflowX = root.scrollWidth - root.clientWidth;
        // Le tableau doit se replier dans son cadre et défiler localement.
        const scrollsLocally = table.scrollWidth > table.clientWidth + 1;
        table.remove();

        return { overflowX, scrollsLocally };
      }, WIDE_TABLE_MARKUP);

      if (!metrics) throw new Error("Contenu d'article introuvable");

      expect(metrics.overflowX).toBe(0);
      expect(metrics.scrollsLocally).toBe(true);
    });
  }
});
