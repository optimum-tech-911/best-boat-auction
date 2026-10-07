import { defineConfig } from "@playwright/test";

const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixels: 50 } },
  use: {
    baseURL: externalBaseURL || "http://127.0.0.1:3000",
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    headless: true,
    trace: "retain-on-failure",
    reducedMotion: "reduce",
  },
  reporter: [["list"], ["html", { open: "never" }]],
  webServer: externalBaseURL ? undefined : {
    command: "pnpm start",
    url: "http://127.0.0.1:3000/fr",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
