import { test, expect } from "../fixtures"
import { E2E_EMAIL, E2E_PASSWORD } from "../test-user"
import type { AppConfig } from "../fixtures"

/**
 * Unauthenticated auth flow tests — shared between Next.js and TanStack Start.
 * No saved session is used — each test starts fresh.
 */

test.describe("Sign-in page", () => {
  test("renders sign-in form", async ({ page, appConfig }) => {
    await page.goto("/sign-in")

    // Both apps render a sign-in form with email, password, and submit button
    await expect(page.getByText(/sign in/i).first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(
      page.getByRole("button", { name: /sign in/i })
    ).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page, appConfig }) => {
    await page.goto("/sign-in")
    await page.fill('input[type="email"]', "nobody@example.com")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    // Next.js uses .text-destructive class; Start shows "Sign in failed" in a div
    await expect(
      page.getByText(/invalid|sign in failed|credentials|password/i).first()
    ).toBeVisible({ timeout: 15_000 })

    // Should stay on sign-in page
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("successful sign-in redirects away from sign-in page", async ({
    page,
    appConfig,
  }) => {
    await page.goto("/sign-in")
    await page.fill('input[type="email"]', E2E_EMAIL)
    await page.fill('input[type="password"]', E2E_PASSWORD)
    await page.click('button[type="submit"]')

    // Should leave sign-in and land on the company dashboard
    await page.waitForURL(
      (url) =>
        !url.pathname.startsWith("/sign-in") && url.pathname !== "/",
      { timeout: 45_000 }
    )
    await expect(page).not.toHaveURL(/\/sign-in/)
  })

  // TanStack Start-specific: demo mode button
  test("demo button navigates to company page", async ({ page, appConfig }) => {
    test.skip(!appConfig.hasDemoMode, "Demo mode not supported")

    await page.goto("/sign-in")
    await page.getByRole("button", { name: /continue with demo/i }).click()
    await expect(page).toHaveURL(/\/app\//, { timeout: 10_000 })
  })
})

test.describe("Protected routes (unauthenticated)", () => {
  test("visiting protected route redirects to sign-in", async ({
    page,
    appConfig,
  }) => {
    await page.goto(`${appConfig.urlPrefix || "/"}`)
    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  // Next.js-specific: UUID-based company URL redirect
  test("visiting a UUID company URL redirects to sign-in", async ({
    page,
    appConfig,
  }) => {
    test.skip(appConfig.urlPrefix !== "", "UUID URL pattern is Next.js-only")

    await page.goto("/00000000-0000-0000-0000-000000000001")
    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  // TanStack Start-specific: demo mode bypass
  test("demo param allows access to protected route", async ({
    page,
    appConfig,
  }) => {
    test.skip(!appConfig.hasDemoMode, "Demo mode not supported")

    await page.goto(`${appConfig.urlPrefix}/acme-corp?demo=1`)
    await expect(
      page.getByRole("heading", { name: /masters|dashboard/i })
    ).toBeVisible({ timeout: 15_000 })
  })
})