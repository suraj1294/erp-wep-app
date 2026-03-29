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

const { eq, inArray } = await import("drizzle-orm")
const { db } = await import("@workspace/db/client")
const {
  accountGroups,
  accounts,
  companies,
  companyUsers,
  items,
  locations,
  parties,
  stockMovements,
  taxRates,
  unitsOfMeasure,
  user,
  voucherItems,
  vouchers,
  voucherTypes,
} = await import("@workspace/db/schema")
const { seedCompanyDefaults } = await import(
  "@workspace/db/seeds/company-defaults"
)

const E2E_EMAIL = process.env.E2E_EMAIL ?? "suraz.patil@gmail.com"
const FIXTURE_NAMES = {
  primaryName: `Settings Primary ${Date.now()}`,
  primaryDisplayName: `Settings Primary Co ${Date.now()}`,
  secondaryName: `Settings Fallback ${Date.now()}`,
  secondaryDisplayName: `Settings Fallback Co ${Date.now()}`,
  addedName: `Settings Added ${Date.now()}`,
  addedDisplayName: `Settings Added Co ${Date.now()}`,
  updatedName: `Settings Updated ${Date.now()}`,
  updatedDisplayName: `Settings Updated Co ${Date.now()}`,
}

let primaryCompanyId = ""
let secondaryCompanyId = ""

async function createFixtureCompany(name: string, displayName: string) {
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
      name,
      displayName,
      createdBy: owner.id,
    })
    .returning({ id: companies.id })

  if (!company) {
    throw new Error("Failed to create settings fixture company")
  }

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: owner.id,
    role: "owner",
  })

  await seedCompanyDefaults(company.id)

  return company.id
}

async function deleteCompany(companyId: string) {
  const companyVouchers = await db
    .select({ id: vouchers.id })
    .from(vouchers)
    .where(eq(vouchers.companyId, companyId))

  if (companyVouchers.length > 0) {
    await db
      .delete(voucherItems)
      .where(
        inArray(
          voucherItems.voucherId,
          companyVouchers.map((voucher) => voucher.id)
        )
      )
    await db.delete(vouchers).where(eq(vouchers.companyId, companyId))
  }

  await db.delete(stockMovements).where(eq(stockMovements.companyId, companyId))
  await db.delete(parties).where(eq(parties.companyId, companyId))
  await db.delete(items).where(eq(items.companyId, companyId))
  await db.delete(locations).where(eq(locations.companyId, companyId))
  await db.delete(unitsOfMeasure).where(eq(unitsOfMeasure.companyId, companyId))
  await db.delete(voucherTypes).where(eq(voucherTypes.companyId, companyId))
  await db.delete(taxRates).where(eq(taxRates.companyId, companyId))
  await db.delete(accounts).where(eq(accounts.companyId, companyId))
  await db.delete(accountGroups).where(eq(accountGroups.companyId, companyId))
  await db.delete(companyUsers).where(eq(companyUsers.companyId, companyId))
  await db.delete(companies).where(eq(companies.id, companyId))
}

function companyRow(page: Page, label: string) {
  return page.locator("tbody tr").filter({ hasText: label })
}

async function gotoSettings(page: Page, companyId: string) {
  await page.goto(`/${companyId}/settings`)
  await expect(page.getByText("Company Settings")).toBeVisible()
}

test.describe("Company settings", () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeAll(async () => {
    primaryCompanyId = await createFixtureCompany(
      FIXTURE_NAMES.primaryName,
      FIXTURE_NAMES.primaryDisplayName
    )
    secondaryCompanyId = await createFixtureCompany(
      FIXTURE_NAMES.secondaryName,
      FIXTURE_NAMES.secondaryDisplayName
    )
  })

  test.afterAll(async () => {
    const companyIds = [primaryCompanyId, secondaryCompanyId]

    const addedCompanies = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.name, FIXTURE_NAMES.addedName))

    for (const company of addedCompanies) {
      companyIds.push(company.id)
    }

    for (const companyId of companyIds) {
      if (companyId) {
        await deleteCompany(companyId)
      }
    }
  })

  test("settings page loads and shows both managed companies", async ({ page }) => {
    await gotoSettings(page, primaryCompanyId)

    await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible()
    await expect(companyRow(page, FIXTURE_NAMES.primaryDisplayName)).toBeVisible()
    await expect(companyRow(page, FIXTURE_NAMES.secondaryDisplayName)).toBeVisible()
    await expect(companyRow(page, FIXTURE_NAMES.primaryDisplayName).getByText("Current")).toBeVisible()
  })

  test("updates company information", async ({ page }) => {
    await gotoSettings(page, primaryCompanyId)

    const row = companyRow(page, FIXTURE_NAMES.primaryDisplayName)
    await row.getByRole("button", { name: "Edit" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: /Edit/i })).toBeVisible()

    await dialog.getByPlaceholder("Acme Corporation", { exact: true }).fill(FIXTURE_NAMES.updatedName)
    await dialog.getByPlaceholder("Acme Corp", { exact: true }).fill(FIXTURE_NAMES.updatedDisplayName)
    await dialog.getByPlaceholder("accounts@acme.com", { exact: true }).fill("settings@example.com")
    await dialog.getByPlaceholder("+91 98765 43210", { exact: true }).fill("9999999999")
    await dialog.getByPlaceholder("22AAAAA0000A1Z5", { exact: true }).fill("22AAAAA0000A1Z5")
    await dialog.getByPlaceholder("AAAAA0000A", { exact: true }).fill("AAAAA0000A")
    await dialog.getByRole("button", { name: "Save" }).click()

    await expect(dialog).not.toBeVisible({ timeout: 15_000 })
    await expect(companyRow(page, FIXTURE_NAMES.updatedDisplayName)).toBeVisible()
    await expect(page.locator("header").getByText(FIXTURE_NAMES.updatedDisplayName)).toBeVisible()
  })

  test("adds a new company from settings", async ({ page }) => {
    await gotoSettings(page, primaryCompanyId)

    await page.getByRole("button", { name: "Add Company" }).click()
    const dialog = page.getByRole("dialog")

    await dialog.getByPlaceholder("Acme Corporation", { exact: true }).fill(FIXTURE_NAMES.addedName)
    await dialog.getByPlaceholder("Acme Corp", { exact: true }).fill(FIXTURE_NAMES.addedDisplayName)
    await dialog.getByRole("button", { name: "Save" }).click()

    await expect(dialog).not.toBeVisible({ timeout: 20_000 })
    await expect(companyRow(page, FIXTURE_NAMES.addedDisplayName)).toBeVisible()
  })

  test("disables a managed company", async ({ page }) => {
    await gotoSettings(page, primaryCompanyId)

    const row = companyRow(page, FIXTURE_NAMES.secondaryDisplayName)
    await row.getByRole("button", { name: "Disable" }).click()

    const alertDialog = page.getByRole("alertdialog")
    await expect(alertDialog).toBeVisible()
    await alertDialog.getByRole("button", { name: "Disable" }).click()

    await expect(alertDialog).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByText("Company disabled successfully.")).toBeVisible({
      timeout: 15_000,
    })
    await page.reload()
    await expect(
      page
        .locator("tbody tr")
        .filter({ hasText: FIXTURE_NAMES.secondaryDisplayName })
        .getByText("Inactive")
    ).toBeVisible()
  })
})
