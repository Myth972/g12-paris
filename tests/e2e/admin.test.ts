import { test, expect } from "../setup/fixtures";
import { loginAsAdmin } from "../setup/auth";

test.describe("Administration", () => {
  test("devrait être redirigé vers login sans authentification", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("devrait afficher le tableau de bord admin après connexion", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await expect(page).toHaveURL(/\/admin/);
    // La page admin n'a pas de <main> : on cible le libellé de sa barre
    // latérale et ses onglets.
    await expect(page.getByText("Administration").first()).toBeVisible();
    await expect(page.getByRole("tab").first()).toBeVisible();
  });

  test("devrait afficher les onglets de navigation admin", async ({ page }) => {
    await loginAsAdmin(page);

    const tabs = page.getByRole("tab");
    await expect(tabs.first()).toBeVisible();
    expect(await tabs.count()).toBeGreaterThanOrEqual(1);
  });

  test("devrait permettre de naviguer vers la bibliothèque admin", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/admin/bibliotheque");
    await expect(page).toHaveURL(/\/admin\/bibliotheque/);
    await expect(page.locator("h1").first()).toBeVisible();
  });
});
