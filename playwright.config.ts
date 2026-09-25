import { defineConfig } from "@playwright/test";

/**
 * Browser tests that click through Carte like a diner and an owner. They use the Chrome already
 * installed on this computer, a local dev server, and temporary accounts they delete afterwards.
 * Run with: npm run test:e2e
 */
export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    channel: "chrome",
    headless: true,
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 180_000,
      },
});
