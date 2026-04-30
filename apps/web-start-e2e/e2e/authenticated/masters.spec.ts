import { test, expect, type Page } from "@playwright/test"

const COMPANY_SLUG = "acme-corp-ltd"

async function gotoMaster(page: Page, segment: string) {
  await page.goto(`/app/${COMPANY_SLUG}/masters/${segment}`)
}

test.describe("Masters — Account Groups", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, "account-groups")
    await expect(page.getByRole("heading", { name: "Account Groups" })).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with heading and table", async ({ page }) => {
    for (const col of ["Name", "Account Type", "Nature", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(page.getByRole("button", { name: "Add Group" })).toBeVisible()
  })

  test("table shows account group rows from DB", async ({ page }) => {
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe("Masters — Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, "accounts")
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with heading and table", async ({ page }) => {
    for (const col of ["Name", "Group", "Opening Balance", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(page.getByRole("button", { name: "Add Account" })).toBeVisible()
  })
})

test.describe("Masters — Voucher Types", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, "voucher-types")
    await expect(page.getByRole("heading", { name: "Voucher Types" })).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with heading and table", async ({ page }) => {
    for (const col of ["Name", "Code", "Class", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(page.getByRole("button", { name: "Add Voucher Type" })).toBeVisible()
  })
})

test.describe("Masters — Parties", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, "parties")
    await expect(page.getByRole("heading", { name: "Parties" })).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with heading and table", async ({ page }) => {
    for (const col of ["Name", "Type", "Phone", "Email", "GSTIN", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(page.getByRole("button", { name: "Add Party" })).toBeVisible()
  })
})

test.describe("Masters — Items", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, "items")
    await expect(page.getByRole("heading", { name: "Items" })).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with heading and table", async ({ page }) => {
    for (const col of ["Name", "Code", "Unit", "Sales Rate", "HSN Code", "Tax Rate", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(page.getByRole("button", { name: "Add Item" })).toBeVisible()
  })
})

test.describe("Masters — Units of Measure", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, "units")
    await expect(page.getByRole("heading", { name: "Units of Measure" })).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with heading and table", async ({ page }) => {
    for (const col of ["Name", "Symbol", "Base Unit", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(page.getByRole("button", { name: "Add Unit" })).toBeVisible()
  })
})

test.describe("Masters sidebar navigation", () => {
  test("all master links are present in sidebar", async ({ page }) => {
    await page.goto(`/app/${COMPANY_SLUG}`)
    await page.getByRole("button", { name: /Masters/ }).click()

    for (const label of ["Account Groups", "Accounts", "Voucher Types", "Parties", "Items", "Units of Measure"]) {
      await expect(page.getByRole("link", { name: label })).toBeVisible()
    }
  })

  test("clicking a master link navigates correctly", async ({ page }) => {
    await page.goto(`/app/${COMPANY_SLUG}`)
    await page.getByRole("button", { name: /Masters/ }).click()
    await page.getByRole("link", { name: "Parties" }).click()
    await expect(page).toHaveURL(/\/masters\/parties/, { timeout: 10_000 })
    await expect(page.getByRole("heading", { name: "Parties" })).toBeVisible({ timeout: 30_000 })
  })
})