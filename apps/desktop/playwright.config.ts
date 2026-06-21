import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: process.env.CI ? "github" : "list",
  testDir: "e2e",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "env ORBIT_E2E_MOCKS=1 pnpm exec vite --config vite.config.ts --host 127.0.0.1",
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:5173",
  },
});
