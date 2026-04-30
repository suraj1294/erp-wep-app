import { test, expect, type Page } from "@playwright/test"

test.describe("Company selection", () => {
  test("/app shows company selection page", async ({ page }) => {
    await page.goto("/app")
    await expect(page.getByText("Select a Company")).toBeVisible({ timeout: 15_000 })
  })
})

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app/acme-corp-ltd")
    await page.waitForURL(/\/app\//, { timeout: 30_000 })
  })

  test("shows company name in header", async ({ page }) => {
    await expect(page.locator("header")).toContainText(/acme/i)
  })

  test("sidebar shows Tally ERP branding", async ({ page }) => {
    await expect(page.getByText("Tally ERP")).toBeVisible()
  })

  test("sidebar has Dashboard link", async ({ page }) => {
    await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible()
  })

  test("sidebar has Masters section", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Masters/ })).toBeVisible()
  })

  test("sidebar expands Masters sub-items", async ({ page }) => {
    await page.getByRole("button", { name: /Masters/ }).click()
    await expect(page.getByRole("link", { name: "Account Groups" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Parties" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Items" })).toBeVisible()
  })

  test("sign out button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible()
  })
})