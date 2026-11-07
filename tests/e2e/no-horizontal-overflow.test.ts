import type { Page } from "@playwright/test";
import { test, expect } from "../setup/fixtures";
import { loginAsAdmin } from "../setup/auth";

/**
 * Garde-fou anti-débordement horizontal sur les pages hors accueil, dont les
 * mises en page à deux colonnes (panier) et la barre latérale admin.
 *
 * Un débordement se mesure sur le document : `scrollWidth - clientWidth`.
 * En cas d'échec, le message nomme les premiers éléments qui dépassent pour
 * éviter d'avoir à recalculer à la main.
 */
const VIEWPORTS = [
  { label: "mobile", width: 375, height: 812 },
  { label: "tablette", width: 768, height: 1024 },
  { label: "desktop", width: 1280, height: 900 },
];

interface OverflowReport {
  overflow: number;
  culprits: string[];
}

async function measureOverflow(page: Page): Promise<OverflowReport> {
  return page.evaluate(async () => {
    // Deux frames : laisse le temps à la mise en page (et aux animations
    // d'entrée) de se stabiliser avant de mesurer.
    await new Promise<void>(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );

    const root = document.documentElement;
    const overflow = root.scrollWidth - root.clientWidth;

    const culprits =
      overflow > 0
        ? Array.from(document.querySelectorAll("body *"))
            .filter(element => {
              const rect = element.getBoundingClientRect();
              return rect.right > root.clientWidth + 1 || rect.left < -1;
            })
            .slice(0, 3)
            .map(element => {
              const className =
                typeof element.className === "string" ? element.className : "";
              const classes = className.split(" ").filter(Boolean).slice(0, 2);
              return [element.tagName.toLowerCase(), ...classes].join(".");
            })
        : [];

    return { overflow, culprits };
  });
}

async function expectNoHorizontalOverflow(page: Page, context: string) {
  const { overflow, culprits } = await measureOverflow(page);

  expect(
    overflow,
    `${context} : débordement de ${overflow}px` +
      (culprits.length ? ` — éléments en cause : ${culprits.join(", ")}` : "")
  ).toBe(0);
}

test.describe("Panier — pas de débordement horizontal", () => {
  for (const viewport of VIEWPORTS) {
    test(`tient dans la largeur en ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/panier");

      await expect(page.locator("main").first()).toBeVisible({
        timeout: 20000,
      });
      await expectNoHorizontalOverflow(page, `/panier en ${viewport.label}`);
    });
  }
});

test.describe("Administration — pas de débordement horizontal", () => {
  for (const viewport of VIEWPORTS) {
    test(`tient dans la largeur en ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await loginAsAdmin(page);

      await expect(page.getByRole("tab").first()).toBeVisible({
        timeout: 20000,
      });
      await expectNoHorizontalOverflow(page, `/admin en ${viewport.label}`);
    });
  }
});

test.describe("Éditeur bibliothèque — pas de débordement horizontal", () => {
  for (const viewport of VIEWPORTS) {
    test(`tient dans la largeur en ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await loginAsAdmin(page);

      await page.goto("/admin/bibliotheque/edition/new");
      await expect(page.locator("h1").first()).toBeVisible({ timeout: 25000 });
      // L'éditeur est lazy-loadé : on attend le premier champ de saisie.
      await expect(
        page.locator('input, textarea, [contenteditable="true"]').first()
      ).toBeVisible({ timeout: 30000 });

      await expectNoHorizontalOverflow(
        page,
        `/admin/bibliotheque/edition/new en ${viewport.label}`
      );
    });
  }
});
