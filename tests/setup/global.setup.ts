import { chromium } from "@playwright/test";

/**
 * Vérifie que le serveur de développement répond avant la suite.
 *
 * `waitUntil: "networkidle"` ne se produit jamais ici : le site sonde le
 * serveur en continu (notifications, compte à rebours), l'attente échouait
 * donc systématiquement après 60 s en affichant un faux « serveur absent ».
 * On attend l'événement de montage React (`header` rendu) à la place.
 */
export default async () => {
  console.log("Préparation de l'environnement Playwright…");

  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    await page.goto("http://localhost:5173", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForSelector("header", { timeout: 30000 });

    await browser.close();
    console.log("Serveur de développement prêt.");
  } catch (error) {
    console.warn("Serveur de développement non joignable :", error);
  }

  process.env.PLAYWRIGHT_TEST_BASE_URL = "http://localhost:5173";

  console.log("Environnement Playwright prêt.");
};
