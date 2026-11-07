import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Le dev server transforme les images à la volée : au-delà de 2 workers
     il sature et les pages restent blanches (timeouts en cascade). */
  workers: process.env.CI ? 1 : 2,
  /* Les premières navigations Vite sont lentes : marge d'assertion. */
  expect: {
    timeout: 10 * 1000,
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5173",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshots on failure */
    screenshot: "only-on-failure",

    /* Record video on failure */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },

    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },

    {
      name: "Desktop Edge",
      use: { ...devices["Desktop Edge"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    // Le serveur choisit un port libre (3000/3001) sans PORT explicite :
    // sans cette variable, Playwright attendrait indéfiniment 5173.
    command: "cross-env PORT=5173 pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  testMatch: [
    "**/tests/**/*.test.{js,ts,jsx,tsx}",
    "**/__tests__/**/*.test.{js,ts,jsx,tsx}",
    "**/?(*.)+(spec|test).{js,ts,jsx,tsx}",
  ],

  /* Global test setup and teardown */
  globalSetup: "./tests/setup/global.setup.ts",
});
