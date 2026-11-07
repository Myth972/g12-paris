import "dotenv/config";
import { test, expect } from "../setup/fixtures";

/**
 * La page de connexion n'utilise pas de <h2> : « Administration » est rendu
 * par CardTitle (un div). Les anciens tests échouaient sur ce sélecteur.
 * Le mot de passe vient de l'environnement, avec repli sur la valeur des
 * fixtures historiques.
 */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 20000 });
}

test.describe("Authentification", () => {
  test("affiche le formulaire de connexion", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByText("Administration", { exact: true })
    ).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("affiche une erreur avec un mot de passe vide", async ({ page }) => {
    await page.goto("/login");

    await page.click('button[type="submit"]');

    // Sonner rend chaque toast dans [data-sonner-toast] (role="status").
    await expect(page.locator("[data-sonner-toast]")).toBeVisible({
      timeout: 10000,
    });
  });

  test("redirige vers l'administration après connexion", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/admin/);
    // La page d'administration n'utilise pas de <main> : on s'appuie sur le
    // libellé « Administration » de sa barre latérale.
    await expect(page.getByText("Administration").first()).toBeVisible();
  });

  test("permet la déconnexion depuis le menu utilisateur", async ({ page }) => {
    await login(page); // Le menu utilisateur vit dans le header public : Radix expose
    // aria-haspopup="menu" sur son déclencheur. Plusieurs menus du header
    // utilisent cet attribut (dont « Culte en ligne ») : le menu utilisateur
    // est le dernier rendu, à droite de la barre.
    await page.goto("/");
    const userMenu = page.locator('header button[aria-haspopup="menu"]').last();
    await expect(userMenu).toBeVisible();
    await userMenu.click();

    // La mutation de déconnexion est asynchrone : naviguer avant sa réponse
    // interromprait la requête et laisserait la session active.
    const logoutResponse = page.waitForResponse(
      response => response.url().includes("auth.logout"),
      { timeout: 20000 }
    );
    await page.getByRole("menuitem", { name: "Déconnexion" }).click();
    expect((await logoutResponse).ok()).toBeTruthy();

    // La session est bien terminée : /admin renvoie au formulaire.
    await page.goto("/admin");
    await expect(page.locator("#password")).toBeVisible({ timeout: 20000 });
  });
});
