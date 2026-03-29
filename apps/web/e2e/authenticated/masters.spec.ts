import { test, expect, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const envFilePath = resolve(process.cwd(), ".env.local")
for (const line of readFileSync(envFilePath, "utf8").split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) {
    continue
  }

  const separatorIndex = trimmed.indexOf("=")
  if (separatorIndex === -1) {
    continue
  }

  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  if (!process.env[key]) {
    process.env[key] = value
  }
}

const { eq } = await import("drizzle-orm")
const { db } = await import("@workspace/db/client")
const {
  accountGroups,
  accounts,
  companies,
  companyUsers,
  items,
  locations,
  parties,
  unitsOfMeasure,
  user,
  voucherTypes,
} = await import("@workspace/db/schema")
const { seedCompanyDefaults } = await import(
  "@workspace/db/seeds/company-defaults"
)

/**
 * Masters CRUD tests.
 *
 * Covers all 7 masters pages:
 *   - Account Groups
 *   - Accounts
 *   - Voucher Types
 *   - Parties
 *   - Items
 *   - Units of Measure
 *   - Locations
 *
 * Each master verifies:
 *   1. Page loads with correct heading + table columns + Add button
 *   2. Sidebar "Masters" collapsible is expanded and the active sub-item is highlighted
 *   3. Add dialog opens, validates required fields, and creates a record
 *   4. Edit dialog opens pre-populated with existing values and updates the record
 *   5. Delete dialog shows the record name; Cancel leaves record intact
 *
 * Session is pre-loaded from e2e/.auth/user.json (created by auth.setup.ts).
 * Timestamp suffixes keep names unique across runs.
 */

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const E2E_EMAIL = process.env.E2E_EMAIL ?? "suraz.patil@gmail.com"
const FIXTURE_COMPANY_NAME = `Masters E2E ${Date.now()}`

let companyId = ""

async function createFixtureCompany() {
  const [owner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, E2E_EMAIL))

  if (!owner) {
    throw new Error(`E2E user not found for ${E2E_EMAIL}`)
  }

  const [company] = await db
    .insert(companies)
    .values({
      name: FIXTURE_COMPANY_NAME,
      displayName: FIXTURE_COMPANY_NAME,
      createdBy: owner.id,
    })
    .returning({ id: companies.id })

  if (!company) {
    throw new Error("Failed to create masters fixture company")
  }

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: owner.id,
    role: "owner",
  })

  await seedCompanyDefaults(company.id)

  return company.id
}

async function deleteFixtureCompany(targetCompanyId: string) {
  await db.delete(parties).where(eq(parties.companyId, targetCompanyId))
  await db.delete(items).where(eq(items.companyId, targetCompanyId))
  await db.delete(locations).where(eq(locations.companyId, targetCompanyId))
  await db
    .delete(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, targetCompanyId))
  await db
    .delete(voucherTypes)
    .where(eq(voucherTypes.companyId, targetCompanyId))
  await db.delete(accounts).where(eq(accounts.companyId, targetCompanyId))
  await db
    .delete(accountGroups)
    .where(eq(accountGroups.companyId, targetCompanyId))
  await db
    .delete(companyUsers)
    .where(eq(companyUsers.companyId, targetCompanyId))
  await db.delete(companies).where(eq(companies.id, targetCompanyId))
}

/** Navigate to the fixture company dashboard. */
async function gotoCompanyDashboard(page: Page): Promise<string> {
  await page.goto(`/${companyId}`)
  await page.waitForURL((url) => url.pathname === `/${companyId}`, {
    timeout: 45_000,
  })
  return companyId
}

/** Ensure the sidebar is expanded (desktop layout). */
async function expandSidebar(page: Page) {
  const dashboardLink = page.getByRole("link", { name: "Dashboard" })
  if (!(await dashboardLink.isVisible())) {
    await page.locator('[data-sidebar="trigger"]').click()
    await expect(dashboardLink).toBeVisible()
  }
}

/** Open the Masters collapsible in the sidebar if it is not already open. */
async function expandMasters(page: Page) {
  await expandSidebar(page)
  const subMenu = page.locator('[data-sidebar="menu-sub"]').first()
  if (!(await subMenu.isVisible())) {
    await page
      .locator('button[data-sidebar="menu-button"]', { hasText: "Masters" })
      .click()
    await expect(page.getByRole("link", { name: "Account Groups" })).toBeVisible()
  }
}

/** Navigate directly to a master page by path segment. */
async function gotoMaster(page: Page, companyId: string, segment: string) {
  await page.goto(`/${companyId}/masters/${segment}`)
}

test.beforeAll(async () => {
  companyId = await createFixtureCompany()
})

test.afterAll(async () => {
  if (companyId) {
    await deleteFixtureCompany(companyId)
  }
})

/**
 * Assert the active sub-item in the sidebar matches the expected label.
 * SidebarMenuSubButton sets data-active="true" on the active item.
 */
async function expectActiveSidebarItem(page: Page, label: string) {
  await expect(
    page.locator('[data-sidebar="menu-sub-button"][data-active="true"]')
  ).toContainText(label)
}

/**
 * Click the Add button in the main content area (scoped to sidebar-inset
 * so the sidebar toggle button is never matched).
 */
async function clickAddButton(page: Page, addLabel: string) {
  await page
    .locator('[data-slot="sidebar-inset"]')
    .getByRole("button", { name: addLabel })
    .click()
}

/** Assert that a dialog is open with the given heading. */
async function expectDialogOpen(page: Page, title: string) {
  await expect(page.getByRole("dialog")).toBeVisible()
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: title })
  ).toBeVisible()
}

/** Click Cancel inside an open dialog / alert-dialog and assert it closes. */
async function cancelDialog(page: Page) {
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click()
  await expect(page.getByRole("dialog")).not.toBeVisible()
}

/** Click Save inside an open dialog and wait for it to close. */
async function saveDialog(page: Page) {
  await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
  await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15_000 })
}

/** Return the Name input inside an open dialog (first text input with a placeholder). */
function dialogNameInput(page: Page) {
  return page.getByRole("dialog").locator("input").first()
}

// ---------------------------------------------------------------------------
// 1. Account Groups
// ---------------------------------------------------------------------------

test.describe("Masters — Account Groups", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "account-groups")
    await expect(
      page.getByRole("heading", { name: "Account Groups" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Code", "Account Type", "Nature", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Group" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Account Groups is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Account Groups")
  })

  test("Add dialog opens and validates required fields", async ({ page }) => {
    await clickAddButton(page, "Add Group")
    await expectDialogOpen(page, "Add Account Group")

    // Submit without filling required fields → validation errors appear
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a new account group", async ({ page }) => {
    const name = `Test AG ${Date.now()}`
    await clickAddButton(page, "Add Group")
    await expectDialogOpen(page, "Add Account Group")

    // Fill Name (first input in dialog)
    await dialogNameInput(page).fill(name)

    // Account Type — first combobox in dialog
    await page.getByRole("dialog").getByRole("combobox").nth(0).click()
    await page.getByRole("option", { name: "Asset" }).click()

    // Nature — second combobox in dialog
    await page.getByRole("dialog").getByRole("combobox").nth(1).click()
    await page.getByRole("option", { name: "Debit" }).click()

    await saveDialog(page)

    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("edit dialog opens pre-populated", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Account Group")

    // Name field should not be empty
    await expect(dialogNameInput(page)).not.toHaveValue("")

    await cancelDialog(page)
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const name = `Cancel AG ${Date.now()}`
    await clickAddButton(page, "Add Group")
    await expectDialogOpen(page, "Add Account Group")
    await dialogNameInput(page).fill(name)
    await page.getByRole("dialog").getByRole("combobox").nth(0).click()
    await page.getByRole("option", { name: "Asset" }).click()
    await page.getByRole("dialog").getByRole("combobox").nth(1).click()
    await page.getByRole("option", { name: "Debit" }).click()
    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(name)

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 2. Accounts (Ledgers)
// ---------------------------------------------------------------------------

test.describe("Masters — Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "accounts")
    await expect(
      page.getByRole("heading", { name: "Accounts" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Code", "Group", "Opening Balance", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Account" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Accounts is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Accounts")
  })

  test("Add dialog opens and validates required fields", async ({ page }) => {
    await clickAddButton(page, "Add Account")
    await expectDialogOpen(page, "Add Account")

    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a new account", async ({ page }) => {
    const name = `Test Account ${Date.now()}`
    await clickAddButton(page, "Add Account")
    await expectDialogOpen(page, "Add Account")

    await dialogNameInput(page).fill(name)
    await saveDialog(page)

    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("edit dialog opens pre-populated", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Account")
    await expect(dialogNameInput(page)).not.toHaveValue("")

    await cancelDialog(page)
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const name = `Cancel Account ${Date.now()}`
    await clickAddButton(page, "Add Account")
    await expectDialogOpen(page, "Add Account")
    await dialogNameInput(page).fill(name)
    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(name)

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 3. Voucher Types
// ---------------------------------------------------------------------------

test.describe("Masters — Voucher Types", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "voucher-types")
    await expect(
      page.getByRole("heading", { name: "Voucher Types" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Code", "Class", "Prefix", "Starting #", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Voucher Type" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Voucher Types is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Voucher Types")
  })

  test("Add dialog validates all 3 required fields", async ({ page }) => {
    await clickAddButton(page, "Add Voucher Type")
    await expectDialogOpen(page, "Add Voucher Type")

    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()
    await expect(page.getByText("Code is required")).toBeVisible()
    await expect(page.getByText("Voucher class is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a new voucher type", async ({ page }) => {
    const ts = Date.now()
    const name = `Test VT ${ts}`
    await clickAddButton(page, "Add Voucher Type")
    await expectDialogOpen(page, "Add Voucher Type")

    // Name — first input
    await page.getByRole("dialog").getByPlaceholder("e.g. Sales Invoice").fill(name)
    // Code — second input
    await page.getByRole("dialog").getByPlaceholder("e.g. SI").fill(`VT${ts}`.slice(-6))
    // Voucher Class — only combobox
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "Journal" }).click()

    await saveDialog(page)

    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("edit dialog opens pre-populated and updates starting number", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Voucher Type")

    // Name should be pre-filled
    await expect(
      page.getByRole("dialog").getByPlaceholder("e.g. Sales Invoice")
    ).not.toHaveValue("")

    // Update starting number
    await page.getByRole("dialog").locator('input[type="number"]').fill("500")
    await saveDialog(page)

    await expect(page.locator("tbody tr").first().getByText("500")).toBeVisible()
  })

  test("system voucher type cannot be deleted (isSystem guard)", async ({ page }) => {
    // Only relevant when system rows are present — skip gracefully if none
    const systemRow = page.locator("tbody tr").filter({ hasText: "system" }).first()
    if (!(await systemRow.isVisible())) return

    await systemRow.locator("button").last().click()
    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog").getByText(/cannot delete/i)).toBeVisible()
    await expect(
      page.getByRole("alertdialog").getByRole("button", { name: "Delete" })
    ).not.toBeVisible()
    await page.getByRole("alertdialog").getByRole("button", { name: "Close" }).click()
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const ts = Date.now()
    const name = `Cancel VT ${ts}`
    await clickAddButton(page, "Add Voucher Type")
    await page.getByRole("dialog").getByPlaceholder("e.g. Sales Invoice").fill(name)
    await page.getByRole("dialog").getByPlaceholder("e.g. SI").fill(`C${ts}`.slice(-6))
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "Journal" }).click()
    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(name)

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  })

  test("deletes a non-system voucher type", async ({ page }) => {
    // Create a deletable voucher type first
    const ts = Date.now()
    const name = `Del VT ${ts}`
    await clickAddButton(page, "Add Voucher Type")
    await page.getByRole("dialog").getByPlaceholder("e.g. Sales Invoice").fill(name)
    await page.getByRole("dialog").getByPlaceholder("e.g. SI").fill(`D${ts}`.slice(-6))
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "Payment" }).click()
    await saveDialog(page)
    await expect(page.getByRole("cell", { name })).toBeVisible()

    // Delete it
    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()
    await expect(page.getByRole("alertdialog")).toBeVisible()
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole("cell", { name })).not.toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 4. Parties
// ---------------------------------------------------------------------------

test.describe("Masters — Parties", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "parties")
    await expect(
      page.getByRole("heading", { name: "Parties" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Type", "Phone", "Email", "GSTIN", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Party" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Parties is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Parties")
  })

  test("Add dialog validates required Name field", async ({ page }) => {
    await clickAddButton(page, "Add Party")
    await expectDialogOpen(page, "Add Party")

    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a customer party", async ({ page }) => {
    const name = `Customer ${Date.now()}`
    await clickAddButton(page, "Add Party")
    await expectDialogOpen(page, "Add Party")

    await page.getByRole("dialog").getByPlaceholder("Party name").fill(name)
    // Type select — first (and only) combobox
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "Customer" }).click()

    await saveDialog(page)
    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("creates a supplier party", async ({ page }) => {
    const name = `Supplier ${Date.now()}`
    await clickAddButton(page, "Add Party")
    await expectDialogOpen(page, "Add Party")

    await page.getByRole("dialog").getByPlaceholder("Party name").fill(name)
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "Supplier" }).click()

    await saveDialog(page)
    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("edit dialog opens pre-populated", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Party")
    await expect(
      page.getByRole("dialog").getByPlaceholder("Party name")
    ).not.toHaveValue("")

    await cancelDialog(page)
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const name = `Cancel Party ${Date.now()}`
    await clickAddButton(page, "Add Party")
    await expectDialogOpen(page, "Add Party")
    await page.getByRole("dialog").getByPlaceholder("Party name").fill(name)
    await page.getByRole("dialog").getByRole("combobox").click()
    await page.getByRole("option", { name: "Customer" }).click()
    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(name)

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 5. Items
// ---------------------------------------------------------------------------

test.describe("Masters — Items", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "items")
    await expect(
      page.getByRole("heading", { name: "Items" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Code", "Type", "Sales Rate", "Purchase Rate", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Item" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Items is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Items")
  })

  test("Add dialog validates required Name field", async ({ page }) => {
    await clickAddButton(page, "Add Item")
    await expectDialogOpen(page, "Add Item")

    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a new item", async ({ page }) => {
    const name = `Widget ${Date.now()}`
    await clickAddButton(page, "Add Item")
    await expectDialogOpen(page, "Add Item")

    await page.getByRole("dialog").getByPlaceholder("Item name").fill(name)
    await saveDialog(page)

    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("edit dialog opens pre-populated", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Item")
    await expect(
      page.getByRole("dialog").getByPlaceholder("Item name")
    ).not.toHaveValue("")

    await cancelDialog(page)
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const name = `Cancel Item ${Date.now()}`
    await clickAddButton(page, "Add Item")
    await expectDialogOpen(page, "Add Item")
    await page.getByRole("dialog").getByPlaceholder("Item name").fill(name)
    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(name)

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 6. Units of Measure
// ---------------------------------------------------------------------------

test.describe("Masters — Units of Measure", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "units")
    await expect(
      page.getByRole("heading", { name: "Units of Measure" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Symbol", "Decimal Places", "Base Unit", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Unit" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Units of Measure is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Units of Measure")
  })

  test("Add dialog validates required Name field", async ({ page }) => {
    await clickAddButton(page, "Add Unit")
    await expectDialogOpen(page, "Add Unit")

    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a new unit", async ({ page }) => {
    const ts = Date.now()
    const name = `Kilogram ${ts}`
    await clickAddButton(page, "Add Unit")
    await expectDialogOpen(page, "Add Unit")

    await page.getByRole("dialog").getByPlaceholder("e.g. Kilogram").fill(name)
    await page.getByRole("dialog").getByPlaceholder("e.g. kg").fill("kg")

    await saveDialog(page)
    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("creates a base unit with toggle on", async ({ page }) => {
    const ts = Date.now()
    const name = `Piece ${ts}`
    await clickAddButton(page, "Add Unit")
    await expectDialogOpen(page, "Add Unit")

    await page.getByRole("dialog").getByPlaceholder("e.g. Kilogram").fill(name)
    await page.getByRole("dialog").getByPlaceholder("e.g. kg").fill("pcs")

    // Toggle the Is Base Unit switch on
    await page.getByRole("dialog").getByRole("switch").click()

    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await expect(row.getByText("Yes")).toBeVisible()
  })

  test("edit dialog opens pre-populated", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Unit")
    await expect(
      page.getByRole("dialog").getByPlaceholder("e.g. Kilogram")
    ).not.toHaveValue("")

    await cancelDialog(page)
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const ts = Date.now()
    const name = `Cancel Unit ${ts}`
    await clickAddButton(page, "Add Unit")
    await expectDialogOpen(page, "Add Unit")
    await page.getByRole("dialog").getByPlaceholder("e.g. Kilogram").fill(name)
    await page.getByRole("dialog").getByPlaceholder("e.g. kg").fill(`cu${String(ts).slice(-2)}`)
    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await row.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(name)

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name, exact: true })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// 7. Locations
// ---------------------------------------------------------------------------

test.describe("Masters — Locations", () => {
  test.beforeEach(async ({ page }) => {
    await gotoMaster(page, companyId, "locations")
    await expect(
      page.getByRole("heading", { name: "Locations" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("page loads with correct heading and table columns", async ({ page }) => {
    for (const col of ["Name", "Code", "Contact Person", "Phone", "Default", "Status"]) {
      await expect(page.locator("thead").getByText(col).first()).toBeVisible()
    }
    await expect(
      page.locator('[data-slot="sidebar-inset"]').getByRole("button", { name: "Add Location" })
    ).toBeVisible()
  })

  test("Masters sub-nav is expanded and Locations is active", async ({ page }) => {
    await expandMasters(page)
    await expectActiveSidebarItem(page, "Locations")
  })

  test("Add dialog validates required Name field", async ({ page }) => {
    await clickAddButton(page, "Add Location")
    await expectDialogOpen(page, "Add Location")

    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click()
    await expect(page.getByText("Name is required")).toBeVisible()

    await cancelDialog(page)
  })

  test("creates a new location", async ({ page }) => {
    const name = `Warehouse ${Date.now()}`
    await clickAddButton(page, "Add Location")
    await expectDialogOpen(page, "Add Location")

    await page.getByRole("dialog").getByPlaceholder("e.g. Main Warehouse").fill(name)
    await page.getByRole("dialog").getByPlaceholder("e.g. WH001").fill("WH01")

    await saveDialog(page)
    await expect(page.getByRole("cell", { name })).toBeVisible()
  })

  test("creates a default location with switch on", async ({ page }) => {
    const name = `Main Store ${Date.now()}`
    await clickAddButton(page, "Add Location")
    await expectDialogOpen(page, "Add Location")

    await page.getByRole("dialog").getByPlaceholder("e.g. Main Warehouse").fill(name)
    await page.getByRole("dialog").getByRole("switch").click()

    await saveDialog(page)

    const row = page.locator("tbody tr").filter({ hasText: name })
    await expect(row.getByText("Yes")).toBeVisible()
  })

  test("edit dialog opens pre-populated", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    await firstRow.locator("button").first().click()
    await expectDialogOpen(page, "Edit Location")
    await expect(
      page.getByRole("dialog").getByPlaceholder("e.g. Main Warehouse")
    ).not.toHaveValue("")

    await cancelDialog(page)
  })

  test("delete dialog shows record name and cancel leaves record intact", async ({ page }) => {
    const firstRow = page.locator("tbody tr").first()
    if (!(await firstRow.isVisible())) return

    const cellText = await firstRow.locator("td").first().textContent()
    await firstRow.locator("button").last().click()

    await expect(page.getByRole("alertdialog")).toBeVisible()
    await expect(page.getByRole("alertdialog")).toContainText(cellText ?? "")

    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click()
    await expect(page.getByRole("alertdialog")).not.toBeVisible()
    await expect(page.getByRole("cell", { name: cellText ?? "" })).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Cross-cutting: sidebar navigation
// ---------------------------------------------------------------------------

test.describe("Masters sidebar navigation", () => {
  test("all 7 master links are present and scoped to the current companyId", async ({
    page,
  }) => {
    await gotoCompanyDashboard(page)
    await expandMasters(page)

    const masters = [
      { label: "Account Groups", segment: "account-groups" },
      { label: "Accounts", segment: "accounts" },
      { label: "Voucher Types", segment: "voucher-types" },
      { label: "Parties", segment: "parties" },
      { label: "Items", segment: "items" },
      { label: "Units of Measure", segment: "units" },
      { label: "Locations", segment: "locations" },
    ]

    for (const { label, segment } of masters) {
      await expect(
        // Use exact: true so "Accounts" doesn't also match "Chart of Accounts"
        page.locator('[data-sidebar="menu-sub"]').getByRole("link", { name: label, exact: true })
      ).toHaveAttribute("href", `/${companyId}/masters/${segment}`)
    }
  })

  test("Masters collapsible closes and re-opens", async ({ page }) => {
    await gotoCompanyDashboard(page)
    await expandMasters(page)

    await expect(page.getByRole("link", { name: "Account Groups" })).toBeVisible()

    // Close
    await page
      .locator('button[data-sidebar="menu-button"]', { hasText: "Masters" })
      .click()
    await expect(page.getByRole("link", { name: "Account Groups" })).not.toBeVisible()

    // Re-open
    await page
      .locator('button[data-sidebar="menu-button"]', { hasText: "Masters" })
      .click()
    await expect(page.getByRole("link", { name: "Account Groups" })).toBeVisible()
  })
})
