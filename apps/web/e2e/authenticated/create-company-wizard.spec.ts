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
  voucherItems,
  vouchers,
  voucherTypes,
} = await import("@workspace/db/schema")

const UUID_PATH = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

const FIXTURE_NAMES = {
  skipName: `Wizard Skip ${Date.now()}`,
  skipDisplayName: `Wizard Skip Co ${Date.now()}`,
  fullName: `Wizard Full ${Date.now()}`,
  fullDisplayName: `Wizard Full Co ${Date.now()}`,
  partyName: `Wizard Customer ${Date.now()}`,
  itemName: `Wizard Item ${Date.now()}`,
  locationName: `Wizard Warehouse ${Date.now()}`,
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

async function cleanupCreatedCompanies() {
  const rows = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(
      inArray(companies.name, [FIXTURE_NAMES.skipName, FIXTURE_NAMES.fullName])
    )

  for (const row of rows) {
    await deleteCompany(row.id)
  }
}

async function gotoCreateCompany(page: Page) {
  await page.goto("/create-company")
  await expect(page.getByText("Create Your Company")).toBeVisible()
  await expect(page.getByText("Company Details").last()).toBeVisible()
}

async function completeCompanyStep(page: Page, name: string, displayName: string) {
  await page.getByPlaceholder("Acme Corporation", { exact: true }).fill(name)
  await page.getByPlaceholder("Acme Corp", { exact: true }).fill(displayName)
  await page.getByRole("button", { name: "Next", exact: true }).click()
}

async function waitForCreatedCompany(page: Page) {
  await page.waitForURL((url) => UUID_PATH.test(url.pathname), { timeout: 45_000 })
  return new URL(page.url()).pathname.split("/")[1]!
}

test.describe("Create company wizard", () => {
  test.afterAll(async () => {
    await cleanupCreatedCompanies()
  })

  test("creates a company while skipping optional setup", async ({ page }) => {
    await gotoCreateCompany(page)
    await completeCompanyStep(
      page,
      FIXTURE_NAMES.skipName,
      FIXTURE_NAMES.skipDisplayName
    )

    await expect(page.getByText("Parties").last()).toBeVisible()
    await page.getByRole("button", { name: "Skip", exact: true }).click()
    await expect(page.getByText("Items").last()).toBeVisible()
    await page.getByRole("button", { name: "Skip", exact: true }).click()
    await expect(page.getByText("Locations").last()).toBeVisible()

    await page.getByRole("button", { name: "Create Company", exact: true }).click()
    const companyId = await waitForCreatedCompany(page)

    await expect(page.locator("header").getByText(FIXTURE_NAMES.skipDisplayName)).toBeVisible()

    await page.goto(`/${companyId}/masters/parties`)
    await expect(page.getByText("No records found.")).toBeVisible()

    await page.goto(`/${companyId}/masters/items`)
    await expect(page.getByText("No records found.")).toBeVisible()
  })

  test("creates a company with optional parties, items, and locations", async ({
    page,
  }) => {
    await gotoCreateCompany(page)
    await completeCompanyStep(
      page,
      FIXTURE_NAMES.fullName,
      FIXTURE_NAMES.fullDisplayName
    )

    await page.getByPlaceholder("Acme Customer", { exact: true }).fill(FIXTURE_NAMES.partyName)
    await page.getByPlaceholder("Acme", { exact: true }).fill("Wizard Customer")
    await page.getByPlaceholder("billing@example.com", { exact: true }).fill("wizard@example.com")
    await page.getByRole("button", { name: "Next", exact: true }).click()

    await page.getByPlaceholder("Standard Widget").fill(FIXTURE_NAMES.itemName)
    await page.getByPlaceholder("WGT-001").fill("WIZ-001")
    await page.getByPlaceholder("120.00").fill("120")
    await page.getByPlaceholder("80.00").fill("80")
    await page.getByRole("button", { name: "Next", exact: true }).click()

    await page.getByPlaceholder("Main Warehouse").fill(FIXTURE_NAMES.locationName)
    await page.getByPlaceholder("WH-01").fill("WIZ-WH")
    await page.getByPlaceholder("+91 98765 43210").fill("8888888888")

    await page.getByRole("button", { name: "Create Company", exact: true }).click()
    const companyId = await waitForCreatedCompany(page)

    await expect(page.locator("header").getByText(FIXTURE_NAMES.fullDisplayName)).toBeVisible()

    await page.goto(`/${companyId}/masters/parties`)
    await expect(page.getByRole("cell", { name: FIXTURE_NAMES.partyName, exact: true })).toBeVisible()

    await page.goto(`/${companyId}/masters/items`)
    await expect(page.getByRole("cell", { name: FIXTURE_NAMES.itemName, exact: true })).toBeVisible()

    await page.goto(`/${companyId}/masters/locations`)
    await expect(page.getByRole("cell", { name: FIXTURE_NAMES.locationName, exact: true })).toBeVisible()
  })
})
