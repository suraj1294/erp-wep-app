import { test, expect } from "../fixtures"
import { E2E_EMAIL, E2E_PASSWORD } from "../test-user"
import type { AppConfig } from "../fixtures"

/**
 * Authenticated dashboard tests — shared between Next.js and TanStack Start.
 * Session is pre-loaded from the appropriate storage state file.
 */

test.describe("Post-login routing", () => {
  test("protected route redirects to the user's company dashboard", async ({
    page,
    appConfig,
    companySlug,
  }) => {
    await page.goto(`${appConfig.urlPrefix || "/"}`)
    // Next.js: /app -> /{companySlug}
    // Start: /app -> company dashboard at /app/{companySlug}
    await expect(page).not.toHaveURL(/\/sign-in/)
  })
})

test.describe("Dashboard layout", () => {
  test.beforeEach(async ({ page, appConfig, companySlug }) => {
    await page.goto(`${appConfig.urlPrefix}/${companySlug}`)
  })

  test("sidebar shows Tally ERP branding", async ({ page }) => {
    await expect(page.getByText("Tally ERP")).toBeVisible()
  })

  test("sidebar has Dashboard link", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
  })

  test("sidebar has Masters section", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Masters/ })
    ).toBeVisible()
  })

  test("sidebar expands Masters sub-items", async ({ page }) => {
    await page.getByRole("button", { name: /Masters/ }).click()
    await expect(
      page.getByRole("link", { name: "Account Groups" })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Parties" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Items" })).toBeVisible()
  })

  test("sign out button is visible", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Sign out" })
    ).toBeVisible()
  })
})

test.describe("Sign out", () => {
  test("clicking Sign out redirects to /sign-in", async ({
    browser,
    appConfig,
    companySlug,
  }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto("/sign-in")
    await expect(page.getByText(/sign in/i).first()).toBeVisible()

    await page.fill('input[type="email"]', E2E_EMAIL)
    await page.fill('input[type="password"]', E2E_PASSWORD)
    await page.click('button[type="submit"]')

    // Wait for redirect away from sign-in
    await page.waitForURL(
      (url) =>
        !url.pathname.startsWith("/sign-in") && url.pathname !== "/",
      { timeout: 45_000 }
    )

    // Navigate to the company dashboard where the sign-out button lives
    await page.goto(`${appConfig.urlPrefix}/${companySlug}`)

    const signOutBtn = page.getByRole("button", { name: "Sign out" })
    await expect(signOutBtn).toBeVisible({ timeout: 10_000 })
    await signOutBtn.click()

    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)

    await context.close()
  })
})