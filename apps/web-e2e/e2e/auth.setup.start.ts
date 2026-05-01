import { test as setup, expect } from "@playwright/test"
import path from "path"
import { E2E_EMAIL, E2E_PASSWORD } from "./test-user"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user-start.json")
const execAsync = promisify(exec)

/**
 * Seeds the demo user and signs in via the TanStack Start API,
 * then persists the session cookies for "start" project tests.
 */
setup.setTimeout(90_000)

setup("sign in and save session (start)", async ({ page }) => {
  const webStartDir = path.join(import.meta.dirname, "../../web-start")
  const env = {
    ...process.env,
    DATABASE_URL:
      process.env.DATABASE_URL ??
      "postgresql://user:password@localhost:5433/tally_erp",
  }

  try {
    await execAsync("pnpm exec tsx ./scripts/seed-demo-user.ts", {
      cwd: webStartDir,
      env,
    })
  } catch (error) {
    console.error("[setup-start] Warning: Failed to seed demo user:", error)
  }

  const signInResponse = await page.request.post("/api/auth/sign-in/email", {
    data: { email: E2E_EMAIL, password: E2E_PASSWORD },
    headers: {
      origin: "http://localhost:3001",
    },
  })

  expect(signInResponse.ok()).toBeTruthy()

  await page.goto("/app")
  await expect(page.getByText("Select a Company")).toBeVisible({
    timeout: 15_000,
  })

  await page.context().storageState({ path: AUTH_FILE })
})