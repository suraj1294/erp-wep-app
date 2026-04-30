import { test, expect } from "@playwright/test"
import { E2E_EMAIL, E2E_PASSWORD } from "../test-user"

test.describe("Sign-in page", () => {
  test("renders sign-in form", async ({ page }) => {
    await page.goto("/sign-in")
    await expect(page.getByText("Sign in to Tally ERP")).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
    await expect(page.getByText("Continue with Demo")).toBeVisible()
  })

  test("demo button navigates to company page", async ({ page }) => {
    await page.goto("/sign-in")
    await page.getByRole("button", { name: "Continue with Demo" }).click()
    await expect(page).toHaveURL(/\/app\/acme-corp/, { timeout: 10_000 })
  })

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/sign-in")
    await page.fill('input[type="email"]', "nobody@example.com")
    await page.fill('input[type="password"]', "wrongpassword")
    await page.click('button[type="submit"]')
    await expect(page.getByText(/sign in failed/i)).toBeVisible({ timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("successful sign-in redirects away from sign-in", async ({ page }) => {
    await page.goto("/sign-in")
    await page.fill('input[type="email"]', E2E_EMAIL)
    await page.fill('input[type="password"]', E2E_PASSWORD)
    await page.click('button[type="submit"]')
    await page.waitForURL(
      (url) => !url.pathname.startsWith("/sign-in") && url.pathname !== "/",
      { timeout: 45_000 }
    )
    await expect(page).not.toHaveURL(/\/sign-in/)
  })
})

test.describe("Protected routes (unauthenticated)", () => {
  test("visiting /app without demo param redirects to sign-in", async ({ page }) => {
    await page.goto("/app")
    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test("visiting /app with demo param allows access", async ({ page }) => {
    await page.goto("/app/acme-corp?demo=1")
    await expect(page.getByRole("heading", { name: /Masters|Dashboard/i })).toBeVisible({ timeout: 15_000 })
  })
})