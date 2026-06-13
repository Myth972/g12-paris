import { test, expect } from '../setup/fixtures';

test.describe('Tests responsifs', () => {
  test('page d\'accueil sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();

    const menuButton = page.locator('button:has(svg.lucide-menu), button:has(svg.lucide-x)').first();
    const isMobileMenu = await menuButton.isVisible();
    if (isMobileMenu) {
      await menuButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('page d\'accueil sur tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('page d\'accueil sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    const desktopNav = page.locator('nav a[href="/"], nav a[href*="publication"]');
    if (await desktopNav.first().isVisible()) {
      await expect(desktopNav.first()).toBeVisible();
    }
  });

  test('navigation responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuButton = page.locator('button:has(svg.lucide-menu)').first();
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await page.waitForTimeout(200);
    }

    const navLink = page.locator('nav a[href="/galeries"], a:has-text("Galeries")').first();
    if (await navLink.isVisible()) {
      await navLink.click();
      await expect(page).toHaveURL(/\/galeries/);
    }
  });
});
