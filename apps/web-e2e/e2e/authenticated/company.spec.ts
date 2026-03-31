import { test, expect, type Page } from "@playwright/test"

/**
 * Company-scoped access control tests.
 */

const COMPANY_PATH = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/|$)/

const sidebarTrigger = (page: Page) => page.locator('[data-sidebar="trigger"]')
const sidebarHeader = (page: Page) => page.locator('[data-sidebar="header"]')

async function getCurrentCompanyName(page: Page) {
  const selectedOption = sidebarHeader(page).locator("option:checked")
  if (await selectedOption.count()) {
    return ((await selectedOption.textContent()) ?? "").trim()
  }

  const headerText = ((await sidebarHeader(page).textContent()) ?? "").trim()
  return headerText.replace(/^T\s*Tally ERP/, "").trim()
}

async function gotoCompanyDashboard(page: Page) {
  await page.goto("/app")
  await page.waitForURL((url) => COMPANY_PATH.test(url.pathname), { timeout: 45_000 })
}

async function expandSidebar(page: Page) {
  const dashboardLink = page.getByRole("link", { name: "Dashboard" })
  if (!(await dashboardLink.isVisible())) {
    await sidebarTrigger(page).click()
    await expect(dashboardLink).toBeVisible()
  }
}

async function expandTransactions(page: Page) {
  await expandSidebar(page)
  const salesLink = page.getByRole("link", { name: "Sales" })
  if (!(await salesLink.isVisible())) {
    await page
      .locator('button[data-sidebar="menu-button"]', { hasText: "Transactions" })
      .click()
    await expect(salesLink).toBeVisible()
  }
}

test.describe("Company access control", () => {
  test("navigating to an unknown company slug redirects to the user's own company", async ({
    page,
  }) => {
    await page.goto("/unknown-company-slug")

    // [companySlug] layout redirects unknown companies to the user's first company
    await page.waitForURL(
      (url) =>
        url.pathname !== "/unknown-company-slug" &&
        !url.pathname.startsWith("/sign-in"),
      { timeout: 45_000 }
    )

    await expect(page).not.toHaveURL("/unknown-company-slug")
    await expect(page.getByRole("heading", { name: "Company Dashboard" })).toBeVisible()
  })

  test("company name appears in the sidebar header and topbar", async ({ page }) => {
    await gotoCompanyDashboard(page)
    await expandSidebar(page)
    const companyName = await getCurrentCompanyName(page)

    expect(companyName).toBeTruthy()

    await expect(sidebarHeader(page)).toContainText(companyName)
    await expect(page.locator("main")).toContainText(companyName)
  })

  test("sidebar nav links are scoped to the current company slug", async ({ page }) => {
    await gotoCompanyDashboard(page)
    await expandSidebar(page)
    await expandTransactions(page)

    const companySlug = new URL(page.url()).pathname.split("/")[1]

    await expect(
      page.getByRole("link", { name: "Chart of Accounts" })
    ).toHaveAttribute("href", `/${companySlug}/accounts`)

    await expect(
      page.getByRole("link", { name: "Parties" })
    ).toHaveAttribute("href", `/${companySlug}/parties`)

    await expect(
      page.getByRole("link", { name: "Sales" })
    ).toHaveAttribute("href", `/${companySlug}/sales`)
  })
})
