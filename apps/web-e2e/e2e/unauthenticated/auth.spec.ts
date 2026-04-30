import { test, expect } from "@playwright/test"
import { E2E_EMAIL, E2E_PASSWORD } from "../test-user"

/**
 * Unauthenticated auth flow tests.
 * No saved session is used — each test starts fresh.
 */

test.describe("Sign-in page", () => {
  test("renders sign-in form", async ({ page }) => {
    await page.goto("/sign-in")
    // CardTitle is a <div> not an <h3> in this shadcn version
    await expect(page.getByText("Sign In").first()).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Forgot password?" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible()
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/sign-in")
    await page.fill('input[type="email"]', "nobody@example.com")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')

    // Button enters loading state while request is in flight
    await expect(page.getByRole("button", { name: "Signing in..." })).toBeVisible()

    // Error message should appear after the request completes
    await expect(page.locator(".text-destructive")).toBeVisible({ timeout: 15_000 })
    await expect(page.locator(".text-destructive")).toContainText(/invalid|credentials|password/i)

    // Should stay on sign-in page
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("successful sign-in redirects away from sign-in page", async ({ page }) => {
    await page.goto("/sign-in")
    await page.fill('input[type="email"]', E2E_EMAIL)
    await page.fill('input[type="password"]', E2E_PASSWORD)
    await page.click('button[type="submit"]')

    // Should leave sign-in and land on the company dashboard or create-company.
    // Allow extra time for Turbopack cold-compile across the redirect chain.
    await page.waitForURL(
      (url) =>
        !url.pathname.startsWith("/sign-in") &&
        !url.pathname.startsWith("/app"),
      { timeout: 45_000 }
    )
    await expect(page).not.toHaveURL(/\/sign-in/)
  })
})

test.describe("Protected routes (unauthenticated)", () => {
  test("visiting /app redirects to /sign-in", async ({ page }) => {
    await page.goto("/app")
    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("visiting a company URL redirects to /sign-in", async ({ page }) => {
    // Use a fake UUID — the middleware should redirect before hitting the DB
    await page.goto("/00000000-0000-0000-0000-000000000001")
    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
