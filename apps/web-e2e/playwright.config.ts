import { defineConfig, devices } from "@playwright/test"

/**
 * E2E test configuration for Tally ERP web app.
 *
 * Projects:
 *  setup        — signs in once and saves session to e2e/.auth/user.json
 *  authenticated — all dashboard / company tests; reuses saved session
 *  unauthenticated — auth page tests (redirects, error messages); no saved session
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests sequentially — DB state is shared */
  fullyParallel: false,
  /* Fail the build on CI if test.only is accidentally left in */
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    /* Turbopack cold-compile can take several seconds on first page visit */
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },

  projects: [
    /* 1. Auth setup — runs first, saves cookies */
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    /* 2. Authenticated tests — depend on setup */
    {
      name: "authenticated",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testIgnore: [/auth\.setup\.ts/, /unauthenticated\/.+\.spec\.ts/],
      testMatch: /authenticated\/.+\.spec\.ts/,
    },

    /* 3. Unauthenticated tests — no saved session */
    {
      name: "unauthenticated",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /unauthenticated\/.+\.spec\.ts/,
    },
  ],

  /* Reuse the dev server if already running; start it otherwise */
  webServer: {
    command: "E2E_SAMPLE_DATA_SEED_DELAY_MS=75 pnpm -C ../web dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
