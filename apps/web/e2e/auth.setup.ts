import { test as setup, expect } from "@playwright/test"
import path from "path"

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user.json")

/**
 * Signs in with the test user and persists the session cookies so that
 * all tests in the "authenticated" project can reuse the session without
 * hitting the login page every time.
 *
 * Credentials are read from env vars so CI can override them:
 *   E2E_EMAIL    (default: suraz.patil@gmail.com)
 *   E2E_PASSWORD (default: Mayank@1294)
 */
setup("sign in and save session", async ({ page }) => {
  const email = process.env.E2E_EMAIL ?? "suraz.patil@gmail.com"
  const password = process.env.E2E_PASSWORD ?? "Mayank@1294"

  await page.goto("/sign-in")
  // CardTitle renders as a <div>, not <h3>, so match by text
  await expect(page.getByText("Sign In").first()).toBeVisible()

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  // After login, /app redirects to /{companyId} (a UUID) or /create-company.
  // Allow 45s for Turbopack cold-compile + DB queries across two redirects.
  await page.waitForURL(
    (url) =>
      !url.pathname.startsWith("/sign-in") &&
      !url.pathname.startsWith("/app") &&
      url.pathname !== "/",
    { timeout: 45_000 }
  )

  // Persist cookies + localStorage for reuse in authenticated tests
  await page.context().storageState({ path: AUTH_FILE })
})
