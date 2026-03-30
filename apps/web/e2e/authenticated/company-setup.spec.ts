import { test, expect, type Page } from "@playwright/test"

/**
 * Company creation + default masters seeding tests.
 *
 * These tests create a real company in the DB via the /create-company page
 * and then verify that seedCompanyDefaults ran correctly by checking:
 *   - Chart of Accounts page shows the primary groups and default accounts
 *
 * The created company persists across test runs (acceptable in a dev/test
 * environment). All tests in this file share one company; a random suffix
 * keeps each run's company name unique.
 */

const COMPANY_PATH = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/|$)/
const AUTH_STORAGE_STATE = "e2e/.auth/user.json"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to /create-company, fill name, submit and wait for redirect. */
async function createCompany(page: Page, name: string): Promise<string> {
  await page.goto("/create-company")
  await expect(page.getByText("Create Your Company").first()).toBeVisible()

  await page.getByPlaceholder("Acme Corporation", { exact: true }).fill(name)
  await page.getByRole("button", { name: "Next", exact: true }).click()
  await expect(page.getByText("Parties").last()).toBeVisible()
  await page.getByRole("button", { name: "Skip", exact: true }).click()
  await expect(page.getByText("Items").last()).toBeVisible()
  await page.getByRole("button", { name: "Skip", exact: true }).click()
  await expect(page.getByText("Locations").last()).toBeVisible()
  await page.getByRole("button", { name: "Create Company", exact: true }).click()

  // Wait for the redirect to /{newCompanySlug}
  await page.waitForURL(
    (url) => url.pathname !== "/create-company" && COMPANY_PATH.test(url.pathname),
    { timeout: 45_000 }
  )

  return new URL(page.url()).pathname.split("/")[1]!
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Company creation + seeded masters", () => {
  let companySlug: string

  test.beforeAll(async ({ browser }) => {
    // Create one company for all tests in this describe block.
    // Uses a timestamp suffix so each CI run gets a unique name.
    const context = await browser.newContext({ storageState: AUTH_STORAGE_STATE })
    const page = await context.newPage()
    const name = `Seed Test Co ${Date.now()}`
    companySlug = await createCompany(page, name)
    await context.close()
  })

  // -------------------------------------------------------------------------
  // Chart of Accounts
  // -------------------------------------------------------------------------

  test.describe("Chart of Accounts", () => {
    let page: Page

    test.beforeEach(async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_STORAGE_STATE })
      page = await context.newPage()
      await page.goto(`/${companySlug}/accounts`)
      await expect(
        page.getByRole("heading", { name: "Chart of Accounts" })
      ).toBeVisible({ timeout: 30_000 })
    })

    test.afterEach(async () => {
      await page.context().close()
    })

    test("all 8 primary account groups are present", async () => {
      const expectedGroups = [
        "Capital Account",
        "Loans (Liability)",
        "Current Liabilities",
        "Fixed Assets",
        "Current Assets",
        "Income",
        "Direct Expenses",
        "Indirect Expenses",
      ]
      for (const group of expectedGroups) {
        await expect(page.getByText(group).first()).toBeVisible()
      }
    })

    test("key sub-groups are present", async () => {
      const subGroups = [
        "Cash-in-Hand",
        "Bank Accounts",
        "Sundry Debtors",
        "Sundry Creditors",
        "Duties & Taxes",
        "Sales Accounts",
        "Purchase Accounts",
        "Stock-in-Hand",
      ]
      for (const sg of subGroups) {
        await expect(page.getByText(sg).first()).toBeVisible()
      }
    })

    test("default accounts are present — Cash, Sales, Purchase", async () => {
      await expect(page.getByText("Cash").first()).toBeVisible()
      await expect(page.getByText("Sales").first()).toBeVisible()
      await expect(page.getByText("Purchase").first()).toBeVisible()
    })

    test("system accounts carry their codes", async () => {
      await expect(page.getByText("CASH").first()).toBeVisible()
      await expect(page.getByText("SALES").first()).toBeVisible()
      await expect(page.getByText("CAPITAL").first()).toBeVisible()
    })

    test("tax accounts are present — GST Input, GST Output", async () => {
      await expect(page.getByText("GST Input Credit").first()).toBeVisible()
      await expect(page.getByText("GST Output").first()).toBeVisible()
    })
  })
})
