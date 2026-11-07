import { test as base, expect, Page } from "@playwright/test";

type MyFixtures = {
  loggedInPage: Page;
};

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/**
 * La page de connexion expose `#password` (et non `input[name="password"]`),
 * et le mot de passe vient de l'environnement pour rester aligné sur le
 * serveur de développement.
 */
export const test = base.extend<MyFixtures>({
  loggedInPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto("/login");
    await page.fill("#password", ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 20000 });
    await use(page);
    await context.close();
  },
});

export { expect };
