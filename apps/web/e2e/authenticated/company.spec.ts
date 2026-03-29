import { test, expect, type Page } from "@playwright/test"

/**
 * Company-scoped access control tests.
 */

const UUID_PATH = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

const sidebarTrigger = (page: Page) => page.locator('[data-sidebar="trigger"]')

async function gotoCompanyDashboard(page: Page) {
  await page.goto("/app")
  await page.waitForURL((url) => UUID_PATH.test(url.pathname), { timeout: 45_000 })
}

async function expandSidebar(page: Page) {
  const dashboardLink = page.getByRole("link", { name: "Dashboard" })
  if (!(await dashboardLink.isVisible())) {
    await sidebarTrigger(page).click()
    await expect(dashboardLink).toBeVisible()
  }
}

test.describe("Company access control", () => {
  test("navigating to an unknown company ID redirects to the user's own company", async ({
    page,
  }) => {
    await page.goto("/00000000-0000-0000-0000-000000000001")

    // [companyId] layout redirects unknown companies to the user's first company
    await page.waitForURL(
      (url) =>
        url.pathname !== "/00000000-0000-0000-0000-000000000001" &&
        !url.pathname.startsWith("/sign-in"),
      { timeout: 45_000 }
    )

    await expect(page).not.toHaveURL("/00000000-0000-0000-0000-000000000001")
    await expect(page.getByRole("heading", { name: "Company Dashboard" })).toBeVisible()
  })

  test("company name appears in the sidebar header and topbar", async ({ page }) => {
    await gotoCompanyDashboard(page)
    await expandSidebar(page)

    // Sidebar header (use .first() — multi-company users also show a <select>)
    await expect(
      page.locator('[data-sidebar="header"]').getByText("Acme Corp").first()
    ).toBeVisible()

    // Topbar (header inside SidebarInset, not a landmark banner when nested)
    await expect(page.locator("header").getByText("Acme Corp")).toBeVisible()
  })

  test("sidebar nav links are scoped to the current companyId", async ({ page }) => {
    await gotoCompanyDashboard(page)
    await expandSidebar(page)

    const companyId = new URL(page.url()).pathname.split("/")[1]

    await expect(
      page.getByRole("link", { name: "Chart of Accounts" })
    ).toHaveAttribute("href", `/${companyId}/accounts`)

    await expect(
      page.getByRole("link", { name: "Parties" })
    ).toHaveAttribute("href", `/${companyId}/parties`)

    await expect(
      page.getByRole("link", { name: "Sales" })
    ).toHaveAttribute("href", `/${companyId}/sales`)
  })
})
