import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  snapshotDir: "./tests/snapshots",
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:6006",

    trace: "on-first-retry",
  },
});
