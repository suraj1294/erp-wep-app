import { test, expect, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const envFilePath = resolve(process.cwd(), "../web/.env.local")
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
const { seedCompanyDefaults } =
  await import("@workspace/db/seeds/company-defaults")
const { createCompanyRecord } = await import("@/lib/company-slug")

const E2E_EMAIL = process.env.E2E_EMAIL ?? "suraz.patil@gmail.com"
const COMPANY_PATH = /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/|$)/
const FIXTURE_NAMES = {
  primaryName: `Settings Primary ${Date.now()}`,
  primaryDisplayName: `Settings Primary Co ${Date.now()}`,
  secondaryName: `Settings Fallback ${Date.now()}`,
  secondaryDisplayName: `Settings Fallback Co ${Date.now()}`,
  addedName: `Settings Added ${Date.now()}`,
  addedDisplayName: `Settings Added Co ${Date.now()}`,
  updatedName: `Settings Updated ${Date.now()}`,
  updatedDisplayName: `Settings Updated Co ${Date.now()}`,
  seedViaUiName: `Settings Seed UI ${Date.now()}`,
  seedViaUiDisplayName: `Settings Seed UI Co ${Date.now()}`,
}

let primaryCompanyId = ""
let secondaryCompanyId = ""
let primaryCompanySlug = ""
const ephemeralCompanyIds = new Set<string>()

async function createFixtureCompany(name: string, displayName: string) {
  const [owner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, E2E_EMAIL))

  if (!owner) {
    throw new Error(`E2E user not found for ${E2E_EMAIL}`)
  }

  const company = await createCompanyRecord({
    name,
    displayName,
    createdBy: owner.id,
  })

  if (!company) {
    throw new Error("Failed to create settings fixture company")
  }

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: owner.id,
    role: "owner",
  })

  await seedCompanyDefaults(company.id)

  return company
}

async function deleteCompany(companyId: string) {
  const companyVouchers = await db
    .select({ id: vouchers.id })
    .from(vouchers)
    .where(eq(vouchers.companyId, companyId))

  if (companyVouchers.length > 0) {
    await db.delete(voucherItems).where(
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

async function gotoSettings(page: Page, companySlug: string) {
  await page.goto(`/${companySlug}/settings`, {
    waitUntil: "domcontentloaded",
  })
  await expect(page.getByText("Company Settings")).toBeVisible()
}

async function createCompanyThroughUi(
  page: Page,
  name: string,
  displayName: string
) {
  await page.goto("/create-company")
  await expect(page.getByText("Create Your Company").first()).toBeVisible()

  await page.getByPlaceholder("Acme Corporation", { exact: true }).fill(name)
  await page.getByPlaceholder("Acme Corp", { exact: true }).fill(displayName)
  await page.getByRole("button", { name: "Next", exact: true }).click()

  await expect(page.getByText("Parties").last()).toBeVisible()
  await page.getByRole("button", { name: "Skip", exact: true }).click()
  await expect(page.getByText("Items").last()).toBeVisible()
  await page.getByRole("button", { name: "Skip", exact: true }).click()
  await expect(page.getByText("Locations").last()).toBeVisible()
  await page
    .getByRole("button", { name: "Create Company", exact: true })
    .click()

  await page.waitForURL(
    (url) =>
      url.pathname !== "/create-company" && COMPANY_PATH.test(url.pathname),
    { timeout: 45_000 }
  )

  return new URL(page.url()).pathname.split("/")[1]!
}

async function waitForSampleDataStatus(
  page: Page,
  companySlug: string,
  expectedStatus: "completed" | "error"
) {
  await expect
    .poll(
      async () =>
        page.evaluate(async (slug) => {
          const response = await fetch(`/${slug}/settings/sample-data-status`, {
            cache: "no-store",
            credentials: "same-origin",
          })

          if (!response.ok) {
            return `http-${response.status}`
          }

          const data = (await response.json()) as {
            progress: { status?: string } | null
          }

          return data.progress?.status ?? "missing"
        }, companySlug),
      {
        timeout: 360_000,
      }
    )
    .toBe(expectedStatus)
}

test.describe("Company settings", () => {
  test.describe.configure({ timeout: 180_000 })

  test.beforeAll(async () => {
    const primaryCompany = await createFixtureCompany(
      FIXTURE_NAMES.primaryName,
      FIXTURE_NAMES.primaryDisplayName
    )
    primaryCompanyId = primaryCompany.id
    primaryCompanySlug = primaryCompany.slug

    const secondaryCompany = await createFixtureCompany(
      FIXTURE_NAMES.secondaryName,
      FIXTURE_NAMES.secondaryDisplayName
    )
    secondaryCompanyId = secondaryCompany.id
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

    for (const companyId of ephemeralCompanyIds) {
      companyIds.push(companyId)
    }

    for (const companyId of new Set(companyIds)) {
      if (companyId) {
        await deleteCompany(companyId)
      }
    }
  })

  test("settings page loads and shows both managed companies", async ({
    page,
  }) => {
    await gotoSettings(page, primaryCompanySlug)

    await expect(
      page.getByRole("link", { name: "Settings", exact: true })
    ).toBeVisible()
    await expect(
      companyRow(page, FIXTURE_NAMES.primaryDisplayName)
    ).toBeVisible()
    await expect(
      companyRow(page, FIXTURE_NAMES.secondaryDisplayName)
    ).toBeVisible()
    await expect(
      companyRow(page, FIXTURE_NAMES.primaryDisplayName).getByText("Current")
    ).toBeVisible()
  })

  test("updates company information", async ({ page }) => {
    await gotoSettings(page, primaryCompanySlug)

    const row = companyRow(page, FIXTURE_NAMES.primaryDisplayName)
    await row.getByRole("button", { name: "Edit" }).click()

    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: /Edit/i })).toBeVisible()

    await dialog
      .getByPlaceholder("Acme Corporation", { exact: true })
      .fill(FIXTURE_NAMES.updatedName)
    await dialog
      .getByPlaceholder("Acme Corp", { exact: true })
      .fill(FIXTURE_NAMES.updatedDisplayName)
    await dialog
      .getByPlaceholder("accounts@acme.com", { exact: true })
      .fill("settings@example.com")
    await dialog
      .getByPlaceholder("+91 98765 43210", { exact: true })
      .fill("9999999999")
    await dialog
      .getByPlaceholder("22AAAAA0000A1Z5", { exact: true })
      .fill("22AAAAA0000A1Z5")
    await dialog
      .getByPlaceholder("AAAAA0000A", { exact: true })
      .fill("AAAAA0000A")
    await dialog.getByRole("button", { name: "Save" }).click()

    await expect(dialog).not.toBeVisible({ timeout: 15_000 })
    await expect(
      companyRow(page, FIXTURE_NAMES.updatedDisplayName)
    ).toBeVisible()
    await expect(
      page.locator("header").getByText(FIXTURE_NAMES.updatedDisplayName)
    ).toBeVisible()
  })

  test("adds a new company from settings", async ({ page }) => {
    await gotoSettings(page, primaryCompanySlug)

    await page.getByRole("button", { name: "Add Company" }).click()
    const dialog = page.getByRole("dialog")

    await dialog
      .getByPlaceholder("Acme Corporation", { exact: true })
      .fill(FIXTURE_NAMES.addedName)
    await dialog
      .getByPlaceholder("Acme Corp", { exact: true })
      .fill(FIXTURE_NAMES.addedDisplayName)
    await dialog.getByRole("button", { name: "Save" }).click()

    await expect(dialog).not.toBeVisible({ timeout: 20_000 })
    await expect(companyRow(page, FIXTURE_NAMES.addedDisplayName)).toBeVisible()
  })

  test("disables a managed company", async ({ page }) => {
    await gotoSettings(page, primaryCompanySlug)

    const row = companyRow(page, FIXTURE_NAMES.secondaryDisplayName)
    await row.getByRole("button", { name: "Disable" }).click()

    const alertDialog = page.getByRole("alertdialog")
    await expect(alertDialog).toBeVisible()
    await alertDialog.getByRole("button", { name: "Disable" }).click()

    await expect(alertDialog).not.toBeVisible({ timeout: 15_000 })
    await expect(page.getByText("Company disabled successfully.")).toBeVisible({
      timeout: 15_000,
    })
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(
      page
        .locator("tbody tr")
        .filter({ hasText: FIXTURE_NAMES.secondaryDisplayName })
        .getByText("Inactive")
    ).toBeVisible()
  })

  test("shows live progress while seeding sample data", async ({ page }) => {
    test.slow()
    test.setTimeout(420_000)

    const seedFixture = await createFixtureCompany(
      `Settings Seed Progress ${Date.now()}`,
      `Settings Seed Progress Co ${Date.now()}`
    )
    ephemeralCompanyIds.add(seedFixture.id)

    await gotoSettings(page, seedFixture.slug)

    const seedCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Developer Tools") })
      .first()
    await expect(seedCard.getByText("Not Started")).toBeVisible()

    await seedCard.getByRole("button", { name: "Seed Sample Data" }).click()

    const alertDialog = page.getByRole("alertdialog")
    await expect(alertDialog).toBeVisible()
    await alertDialog
      .getByRole("button", { name: "Seed Sample Data" })
      .click()

    await expect(seedCard.getByTestId("sample-data-seed-status")).toHaveText(
      "Running",
      {
        timeout: 15_000,
      }
    )
    await expect(seedCard).toContainText("Validate company", {
      timeout: 15_000,
    })
    await expect(seedCard).toContainText(
      "Validating company for sample data.",
      {
        timeout: 15_000,
      }
    )

    await waitForSampleDataStatus(page, seedFixture.slug, "completed")
    await page.reload({ waitUntil: "domcontentloaded" })
    await expect(seedCard.getByTestId("sample-data-seed-status")).toHaveText(
      "Ready",
      {
        timeout: 30_000,
      }
    )
    await expect(seedCard).toContainText("Post sample vouchers", {
      timeout: 30_000,
    })
    await expect(seedCard).toContainText("Finalize seed", {
      timeout: 30_000,
    })
    await expect(seedCard).toContainText("Ready to use.", {
      timeout: 30_000,
    })
    await expect(
      seedCard.getByRole("button", { name: "Already Seeded" })
    ).toBeVisible()
  })

  test("creates a fresh company and seeds sample data from settings", async ({
    page,
  }) => {
    test.slow()
    test.setTimeout(420_000)

    const companySlug = await createCompanyThroughUi(
      page,
      FIXTURE_NAMES.seedViaUiName,
      FIXTURE_NAMES.seedViaUiDisplayName
    )

    const [createdCompany] = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.slug, companySlug))

    if (!createdCompany) {
      throw new Error("Failed to find created company after UI setup")
    }

    ephemeralCompanyIds.add(createdCompany.id)
    await gotoSettings(page, companySlug)

    const seedCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Developer Tools") })
      .first()

    await expect(seedCard.getByText("Not Started")).toBeVisible()
    await seedCard.getByRole("button", { name: "Seed Sample Data" }).click()

    const alertDialog = page.getByRole("alertdialog")
    await expect(alertDialog).toBeVisible()
    await alertDialog
      .getByRole("button", { name: "Seed Sample Data" })
      .click()

    await expect(seedCard.getByTestId("sample-data-seed-status")).toHaveText(
      "Running",
      {
        timeout: 15_000,
      }
    )
    await expect(seedCard).toContainText(
      "Validating company for sample data.",
      {
        timeout: 15_000,
      }
    )

    await waitForSampleDataStatus(page, companySlug, "completed")
    await page.reload()
    await expect(seedCard.getByTestId("sample-data-seed-status")).toHaveText(
      "Ready",
      {
        timeout: 30_000,
      }
    )
    await expect(seedCard).toContainText("Ready to use.", {
      timeout: 30_000,
    })

    await page.goto(`/${companySlug}/parties`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.getByText("Total Parties")).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText("Arya Retail Private Limited")).toBeVisible({
      timeout: 30_000,
    })

    await page.goto(`/${companySlug}/items`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.getByText("Total Items")).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText("Laptop Pro 14")).toBeVisible({
      timeout: 30_000,
    })

    await page.goto(`/${companySlug}/sales`, {
      waitUntil: "domcontentloaded",
    })
    await expect(page.getByText("Sales Invoices")).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByText("INV-0001")).toBeVisible({ timeout: 30_000 })
  })
})
