import { test, expect } from "../fixtures"
import type { AppConfig } from "../fixtures"

/**
 * Shared masters page-load smoke tests — run against both Next.js and TanStack Start.
 * Verifies that each master page loads with the correct heading and table columns.
 *
 * Full CRUD tests (add/edit/delete dialogs, sidebar data-attrs) remain in
 * masters-crud.spec.ts and only run against the Next.js project.
 */

const MASTERS = [
  {
    heading: "Account Groups",
    segment: "account-groups",
    columns: ["Name", "Account Type", "Nature", "Status"],
    addButton: "Add Group",
  },
  {
    heading: "Accounts",
    segment: "accounts",
    columns: ["Name", "Group", "Opening Balance", "Status"],
    addButton: "Add Account",
  },
  {
    heading: "Voucher Types",
    segment: "voucher-types",
    columns: ["Name", "Code", "Class", "Status"],
    addButton: "Add Voucher Type",
  },
  {
    heading: "Parties",
    segment: "parties",
    columns: ["Name", "Type", "Phone", "Email", "GSTIN", "Status"],
    addButton: "Add Party",
  },
  {
    heading: "Items",
    segment: "items",
    columns: ["Name", "Code", "Unit", "Sales Rate", "HSN Code", "Tax Rate", "Status"],
    addButton: "Add Item",
  },
  {
    heading: "Units of Measure",
    segment: "units",
    columns: ["Name", "Symbol", "Base Unit", "Status"],
    addButton: "Add Unit",
  },
] as const

for (const master of MASTERS) {
  test.describe(`Masters — ${master.heading}`, () => {
    test.beforeEach(async ({ page, appConfig, companySlug }) => {
      await page.goto(
        `${appConfig.urlPrefix}/${companySlug}/masters/${master.segment}`
      )
      await expect(
        page.getByRole("heading", { name: master.heading })
      ).toBeVisible({ timeout: 30_000 })
    })

    test("page loads with heading and table columns", async ({ page }) => {
      for (const col of master.columns) {
        await expect(
          page.locator("thead").getByText(col).first()
        ).toBeVisible()
      }
    })

    test("Add button is visible", async ({ page }) => {
      await expect(
        page.getByRole("button", { name: master.addButton })
      ).toBeVisible()
    })
  })
}

test.describe("Masters sidebar navigation", () => {
  test("all master links are present in sidebar", async ({
    page,
    appConfig,
    companySlug,
  }) => {
    await page.goto(`${appConfig.urlPrefix}/${companySlug}`)
    await page.getByRole("button", { name: /Masters/ }).click()

    for (const label of [
      "Account Groups",
      "Accounts",
      "Voucher Types",
      "Parties",
      "Items",
      "Units of Measure",
    ]) {
      await expect(
        page.getByRole("link", { name: label })
      ).toBeVisible()
    }
  })

  test("clicking a master link navigates correctly", async ({
    page,
    appConfig,
    companySlug,
  }) => {
    await page.goto(`${appConfig.urlPrefix}/${companySlug}`)
    await page.getByRole("button", { name: /Masters/ }).click()
    await page.getByRole("link", { name: "Parties" }).click()
    await expect(page).toHaveURL(/\/masters\/parties/, { timeout: 10_000 })
    await expect(
      page.getByRole("heading", { name: "Parties" })
    ).toBeVisible({ timeout: 30_000 })
  })
})