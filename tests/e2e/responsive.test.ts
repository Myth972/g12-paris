import { test, expect } from "../setup/fixtures";

/**
 * Le bouton du menu mobile est identifié par son aria-label réel
 * (« Menu de navigation ») et non par l'icône Lucide, dont la classe
 * générée n'est pas un contrat stable.
 */
test.describe("Tests responsifs", () => {
  const viewports = [
    { label: "mobile", width: 375, height: 667 },
    { label: "tablette", width: 768, height: 1024 },
    { label: "desktop", width: 1920, height: 1080 },
  ];

  for (const viewport of viewports) {
    test(`accueil sans débordement en ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      await expect(page.locator("header")).toBeVisible();
      await expect(page.locator("footer")).toBeVisible();

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
      );
      expect(overflow).toBe(0);
    });
  }

  test("ouvre le menu mobile et navigue vers Galeries", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    const menuButton = page.getByRole("button", {
      name: "Menu de navigation",
    });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const galeriesLink = page
      .locator('header nav a[href="/galeries"]:visible')
      .first();
    await expect(galeriesLink).toBeVisible();
    await galeriesLink.click();

    await expect(page).toHaveURL(/\/galeries/);
  });
});
