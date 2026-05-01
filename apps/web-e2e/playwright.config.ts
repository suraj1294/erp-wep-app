import { defineConfig, devices } from "@playwright/test"
import { nextjsConfig, startConfig } from "./e2e/fixtures"

/**
 * Unified E2E test configuration for Tally ERP web apps.
 *
 * Projects:
 *  setup-nextjs    — signs in via Next.js UI, saves session to .auth/user-nextjs.json
 *  setup-start     — seeds demo user + signs in via Start API, saves session to .auth/user-start.json
 *  nextjs          — all dashboard/masters/vouchers/etc tests against Next.js (port 3000)
 *  start           — shared smoke tests against TanStack Start (port 3001)
 *  nextjs-unauth   — unauthenticated auth tests against Next.js
 *  start-unauth    — unauthenticated auth tests against TanStack Start
 *  start-app       — TanStack Start home page (no auth needed)
 */

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 45_000,
  },

  projects: [
    // ---- Auth setup projects ----

    {
      name: "setup-nextjs",
      testMatch: /auth\.setup\.nextjs\.ts/,
      use: {
        baseURL: process.env.NEXTJS_BASE_URL ?? "http://localhost:3000",
      },
    },

    {
      name: "setup-start",
      testMatch: /auth\.setup\.start\.ts/,
      use: {
        baseURL: process.env.START_BASE_URL ?? "http://localhost:3001",
      },
    },

    // ---- Next.js authenticated tests ----

    {
      name: "nextjs",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.NEXTJS_BASE_URL ?? "http://localhost:3000",
        storageState: "e2e/.auth/user-nextjs.json",
        appConfig: nextjsConfig,
      },
      dependencies: ["setup-nextjs"],
      testIgnore: [
        /auth\.setup\..+\.ts/,
        /start-app\/.+\.spec\.ts/,
      ],
      testMatch: /authenticated\/.+\.spec\.ts/,
    },

    // ---- TanStack Start authenticated tests ----

    {
      name: "start",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.START_BASE_URL ?? "http://localhost:3001",
        storageState: "e2e/.auth/user-start.json",
        appConfig: startConfig,
      },
      dependencies: ["setup-start"],
      testIgnore: [
        /auth\.setup\..+\.ts/,
        /start-app\/.+\.spec\.ts/,
      ],
      // Only run shared smoke tests and dashboard, not Next.js-specific CRUD
      testMatch: [
        /authenticated\/dashboard\.spec\.ts/,
        /authenticated\/masters\.spec\.ts/,
      ],
    },

    // ---- Unauthenticated tests ----

    {
      name: "nextjs-unauth",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.NEXTJS_BASE_URL ?? "http://localhost:3000",
        appConfig: nextjsConfig,
      },
      testMatch: /unauthenticated\/.+\.spec\.ts/,
    },

    {
      name: "start-unauth",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.START_BASE_URL ?? "http://localhost:3001",
        appConfig: startConfig,
      },
      testMatch: /unauthenticated\/.+\.spec\.ts/,
    },

    // ---- Start-only home page test ----

    {
      name: "start-app",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: process.env.START_BASE_URL ?? "http://localhost:3001",
      },
      testMatch: /start-app\/.+\.spec\.ts/,
    },
  ],

  /* Reuse the dev servers if already running; start them otherwise */
  webServer: [
    {
      command: "E2E_SAMPLE_DATA_SEED_DELAY_MS=75 pnpm -C ../web dev",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter web-start dev",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})