import { test, expect, type Page } from "@playwright/test"
import { E2E_EMAIL, E2E_PASSWORD } from "../test-user"

/**
 * Authenticated dashboard tests.
 * Session is pre-loaded from e2e/.auth/user.json (created by auth.setup.ts).
 */

/** Company slug pathname regex, e.g. /acme-corp */
const COMPANY_PATH = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/|$)/
/**
 * The visible sidebar toggle button (SidebarTrigger lives inside the topbar).
 * shadcn also renders an invisible SidebarRail with the same aria-label, so we
 * scope the selector to the one that has data-sidebar="trigger".
 */
const sidebarTrigger = (page: Page) =>
  page.locator('[data-sidebar="trigger"]')
const sidebar = (page: Page) => page.locator('[data-sidebar="sidebar"]').first()
const sidebarHeader = (page: Page) => page.locator('[data-sidebar="header"]')

async function getCurrentCompanyName(page: Page) {
  const selectedOption = sidebarHeader(page).locator("option:checked")
  if (await selectedOption.count()) {
    return ((await selectedOption.textContent()) ?? "").trim()
  }

  const headerText = ((await sidebarHeader(page).textContent()) ?? "").trim()
  return headerText.replace(/^T\s*Tally ERP/, "").trim()
}

/** Navigate to /app and wait until the company redirect resolves. */
async function gotoCompanyDashboard(page: Page) {
  await page.goto("/app")
  await page.waitForURL((url) => COMPANY_PATH.test(url.pathname), { timeout: 45_000 })
}

/** Ensure the sidebar is expanded so nav labels are visible. */
async function expandSidebar(page: Page) {
  const dashboardLink = sidebar(page).getByRole("link", { name: "Dashboard" })
  if (!(await dashboardLink.isVisible())) {
    await sidebarTrigger(page).click()
    await expect(dashboardLink).toBeVisible()
  }
}

async function signInFreshSession(page: Page) {
  await page.goto("/sign-in")
  await expect(page.getByText("Sign In").first()).toBeVisible()

  await page.fill('input[type="email"]', E2E_EMAIL)
  await page.fill('input[type="password"]', E2E_PASSWORD)
  await page.click('button[type="submit"]')

  await page.waitForURL(
    (url) =>
      !url.pathname.startsWith("/sign-in") &&
      !url.pathname.startsWith("/app") &&
      url.pathname !== "/",
    { timeout: 45_000 }
  )
}

test.describe("Post-login routing", () => {
  test("/app redirects to the user's company dashboard", async ({ page }) => {
    await gotoCompanyDashboard(page)
    await expect(page).not.toHaveURL(/\/app/)
    await expect(page).not.toHaveURL(/\/sign-in/)
    await expect(page).not.toHaveURL(/\/create-company/)
  })
})

test.describe("Dashboard layout", () => {
  test.beforeEach(async ({ page }) => {
    await gotoCompanyDashboard(page)
  })

  test("sidebar shows Tally ERP branding and company name", async ({ page }) => {
    await expandSidebar(page)
    const companyName = await getCurrentCompanyName(page)

    expect(companyName).toBeTruthy()
    await expect(page.getByText("Tally ERP")).toBeVisible()
    await expect(sidebarHeader(page)).toContainText(companyName)
  })

  test("sidebar displays visible navigation groups and links", async ({ page }) => {
    await expandSidebar(page)
    for (const item of [
      "Dashboard",
      "Transactions",
      "Masters",
      "Chart of Accounts",
      "Parties",
      "Items",
      "Settings",
    ]) {
      const locator = item === "Transactions" || item === "Masters"
        ? sidebar(page).getByRole("button", { name: item, exact: true })
        : sidebar(page).getByRole("link", { name: item })
      await expect(locator).toBeVisible()
    }
  })

  test("Dashboard nav item is marked active on the dashboard page", async ({ page }) => {
    await expandSidebar(page)
    // shadcn sidebar sets data-active="true" on the active menu button
    const activeButton = page.locator('[data-sidebar="menu-button"][data-active="true"]')
    await expect(activeButton).toBeVisible()
  })

  test("sidebar footer shows user name, email and role", async ({ page }) => {
    await expandSidebar(page)
    const footer = page.locator('[data-sidebar="footer"]')
    const footerDetails = footer.locator("p")

    await expect(footerDetails.nth(0)).toBeVisible()
    await expect(footerDetails.nth(0)).not.toHaveText(/^\s*$/)
    await expect(footerDetails.nth(1)).toHaveText(E2E_EMAIL)
    await expect(footerDetails.nth(2)).toBeVisible()
    await expect(footerDetails.nth(2)).toContainText(/owner|admin|viewer/i)
  })

  test("sidebar collapses and expands via toggle", async ({ page }) => {
    const trigger = sidebarTrigger(page)
    // data-state lives on the outer sidebar wrapper (data-side="left"), not the inner content div
    const sidebar = page.locator('[data-slot="sidebar"][data-side="left"]')

    const initialState = await sidebar.getAttribute("data-state")
    expect(initialState).toBeTruthy()

    // Toggle once
    await trigger.click()
    const toggledState = await sidebar.getAttribute("data-state")
    expect(toggledState).not.toBe(initialState)

    // Toggle back
    await trigger.click()
    await expect(sidebar).toHaveAttribute("data-state", initialState!)
  })

  test("topbar shows company name", async ({ page }) => {
    const companyName = await getCurrentCompanyName(page)

    expect(companyName).toBeTruthy()
    await expect(page.locator("main")).toContainText(companyName)
  })

  test("dashboard page shows summary stat cards", async ({ page }) => {
    const companyName = await getCurrentCompanyName(page)

    expect(companyName).toBeTruthy()
    await expect(page.getByRole("heading", { name: companyName })).toBeVisible()
    for (const card of ["Accounts", "Vouchers", "Parties", "Items"]) {
      await expect(page.getByText(card).first()).toBeVisible()
    }
  })
})

test.describe("Sign out", () => {
  test("clicking Sign out redirects to /sign-in", async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await signInFreshSession(page)
    await expandSidebar(page)

    const signOutBtn = page.getByRole("button", { name: "Sign out" })
    await expect(signOutBtn).toBeVisible()
    await signOutBtn.click()

    await page.waitForURL(/\/sign-in/, { timeout: 15_000 })
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.getByText("Sign In").first()).toBeVisible()

    await context.close()
  })
})
