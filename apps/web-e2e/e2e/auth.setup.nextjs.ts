import { test as setup, expect } from "@playwright/test"
import path from "path"
import { E2E_EMAIL, E2E_PASSWORD } from "./test-user"

const AUTH_FILE = path.join(import.meta.dirname, ".auth/user-nextjs.json")

/**
 * Signs in with the test user via the Next.js UI and persists the session
 * cookies so that all tests in the "nextjs" project can reuse the session.
 */
setup("sign in and save session (nextjs)", async ({ page }) => {
  await page.goto("/sign-in")
  await expect(page.getByText("Sign In").first()).toBeVisible()

  await page.fill('input[type="email"]', E2E_EMAIL)
  await page.fill('input[type="password"]', E2E_PASSWORD)
  await page.click('button[type="submit"]')

  // After login, /app redirects to /{companySlug} or /create-company.
  // Allow 45s for Turbopack cold-compile + DB queries across two redirects.
  await page.waitForURL(
    (url) =>
      !url.pathname.startsWith("/sign-in") &&
      !url.pathname.startsWith("/app") &&
      url.pathname !== "/",
    { timeout: 45_000 }
  )

  await page.context().storageState({ path: AUTH_FILE })
})