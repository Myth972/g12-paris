import "dotenv/config";
import type { Page } from "@playwright/test";

/**
 * Le mot de passe admin vient du `.env` du serveur de développement :
 * une valeur codée en dur fait échouer la connexion dès qu'il change.
 */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#password", ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin", { timeout: 20000 });
}
