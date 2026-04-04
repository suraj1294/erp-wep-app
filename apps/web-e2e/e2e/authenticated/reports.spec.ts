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

const { eq } = await import("drizzle-orm")
const { db } = await import("@workspace/db/client")
const {
  accountGroups,
  accounts,
  companies,
  companyUsers,
  items,
  parties,
  unitsOfMeasure,
  user,
} = await import("@workspace/db/schema")
const { seedCompanyDefaults } = await import(
  "@workspace/db/seeds/company-defaults"
)
const { createCompanyRecord } = await import("@/lib/company-slug")

const E2E_EMAIL = process.env.E2E_EMAIL ?? "suraz.patil@gmail.com"
const FIXTURE_COMPANY_NAME = `Reports E2E ${Date.now()}`

let companyId = ""
let companySlug = ""

async function createFixtureCompany() {
  const [owner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, E2E_EMAIL))

  if (!owner) {
    throw new Error(`E2E user not found for ${E2E_EMAIL}`)
  }

  const company = await createCompanyRecord({
    name: FIXTURE_COMPANY_NAME,
    displayName: FIXTURE_COMPANY_NAME,
    createdBy: owner.id,
  })

  if (!company) {
    throw new Error("Failed to create reports fixture company")
  }

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: owner.id,
    role: "owner",
  })

  await seedCompanyDefaults(company.id)

  const groupsList = await db
    .select({
      id: accountGroups.id,
      name: accountGroups.name,
      code: accountGroups.code,
    })
    .from(accountGroups)
    .where(eq(accountGroups.companyId, company.id))

  const groupIdByCode = new Map(
    groupsList.filter((group) => group.code).map((group) => [group.code!, group.id])
  )

  const bankGroupId = groupIdByCode.get("BANK-GRP")
  const creditorGroupId = groupIdByCode.get("CRED")
  const salesGroupId = groupIdByCode.get("SALES-GRP")
  const purchaseGroupId = groupIdByCode.get("PUR-GRP")

  if (!bankGroupId || !creditorGroupId || !salesGroupId || !purchaseGroupId) {
    throw new Error("Seeded reports fixture is missing expected account groups")
  }

  await db.insert(accounts).values([
    {
      companyId: company.id,
      groupId: bankGroupId,
      name: "Axis Bank E2E",
      code: "AXIS-E2E",
      openingBalance: "1000.00",
      currentBalance: "2500.00",
    },
    {
      companyId: company.id,
      groupId: creditorGroupId,
      name: "Vendor Payables E2E",
      code: "PAY-E2E",
      openingBalance: "500.00",
      currentBalance: "800.00",
    },
    {
      companyId: company.id,
      groupId: salesGroupId,
      name: "Retail Sales E2E",
      code: "SALE-E2E",
      openingBalance: "0.00",
      currentBalance: "7000.00",
    },
    {
      companyId: company.id,
      groupId: purchaseGroupId,
      name: "Raw Material Purchase E2E",
      code: "PUR-E2E",
      openingBalance: "0.00",
      currentBalance: "3200.00",
    },
  ])

  const [numbersUnit] = await db
    .select({
      id: unitsOfMeasure.id,
      symbol: unitsOfMeasure.symbol,
    })
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, company.id))

  if (!numbersUnit) {
    throw new Error("Seeded reports fixture is missing a unit of measure")
  }

  await db.insert(parties).values([
    {
      companyId: company.id,
      type: "customer",
      name: "Acme Retail E2E",
      displayName: "Acme Retail Private Limited",
      contactPerson: "Asha Sharma",
      phone: "9876543210",
      email: "acme@example.com",
      gstin: "27ABCDE1234F1Z5",
      pan: "ABCDE1234F",
      creditLimit: "250000.00",
      creditDays: 30,
      isActive: true,
      address: {
        line1: "12 Market Road",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411001",
      },
      taxRegistration: {
        regime: "GST Regular",
      },
    },
    {
      companyId: company.id,
      type: "supplier",
      name: "Supply Hub E2E",
      contactPerson: "Ravi Mehta",
      phone: "9123456780",
      email: "supply@example.com",
      gstin: "27AACCS1234Q1ZZ",
      creditLimit: "90000.00",
      creditDays: 15,
      isActive: true,
    },
    {
      companyId: company.id,
      type: "both",
      name: "Universal Traders E2E",
      contactPerson: "Nina Patel",
      phone: "9000000001",
      email: "universal@example.com",
      gstin: "24AAACU1234L1Z9",
      creditLimit: "120000.00",
      creditDays: 21,
      isActive: false,
    },
  ])

  await db.insert(items).values([
    {
      companyId: company.id,
      name: "Copper Wire E2E",
      code: "WIRE-E2E",
      category: "Electrical",
      brand: "VoltPro",
      unitId: numbersUnit.id,
      itemType: "goods",
      hsnCode: "7408",
      purchaseRate: "100.00",
      salesRate: "150.00",
      reorderLevel: "20.00",
      currentStock: "15.000",
      stockValue: "1500.00",
      isActive: true,
    },
    {
      companyId: company.id,
      name: "Installation Service E2E",
      code: "SERV-E2E",
      category: "Services",
      brand: "ServiceCo",
      unitId: numbersUnit.id,
      itemType: "service",
      hsnCode: "9987",
      purchaseRate: "0.00",
      salesRate: "2000.00",
      reorderLevel: "0.00",
      currentStock: "0.000",
      stockValue: "0.00",
      isActive: true,
    },
    {
      companyId: company.id,
      name: "LED Bulb E2E",
      code: "LED-E2E",
      category: "Electrical",
      brand: "BrightLite",
      unitId: numbersUnit.id,
      itemType: "goods",
      hsnCode: "8539",
      purchaseRate: "50.00",
      salesRate: "85.00",
      reorderLevel: "10.00",
      currentStock: "40.000",
      stockValue: "2000.00",
      isActive: false,
    },
  ])

  return company
}

async function deleteFixtureCompany(targetCompanyId: string) {
  await db.delete(parties).where(eq(parties.companyId, targetCompanyId))
  await db.delete(items).where(eq(items.companyId, targetCompanyId))
  await db.delete(accounts).where(eq(accounts.companyId, targetCompanyId))
  await db
    .delete(companyUsers)
    .where(eq(companyUsers.companyId, targetCompanyId))
  await db.delete(companies).where(eq(companies.id, targetCompanyId))
}

async function expandSidebar(page: Page) {
  const dashboardLink = page.getByRole("link", { name: "Dashboard" })
  if (!(await dashboardLink.isVisible())) {
    await page.locator('[data-sidebar="trigger"]').click()
    await expect(dashboardLink).toBeVisible()
  }
}

async function expectActiveReportLink(page: Page, label: string) {
  await expandSidebar(page)
  await expect(
    page.locator('[data-sidebar="menu-button"][data-active="true"]')
  ).toContainText(label)
}

async function selectToolbarOption(page: Page, index: number, label: string) {
  await page.locator('[data-slot="select-trigger"]').nth(index).click()
  await page
    .locator('[data-slot="select-item"]')
    .filter({ hasText: label })
    .first()
    .click()
}

async function toggleAccountGroup(page: Page, label: string) {
  const container = page
    .getByText(label, { exact: true })
    .locator("xpath=ancestor::*[@data-slot='collapsible'][1]")

  await container.locator('[data-slot="collapsible-trigger"]').click()
}

test.beforeAll(async () => {
  const company = await createFixtureCompany()
  companyId = company.id
  companySlug = company.slug
})

test.afterAll(async () => {
  if (companyId) {
    await deleteFixtureCompany(companyId)
  }
})

test.describe("Reports — Chart of Accounts", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${companySlug}/accounts`)
    await expect(
      page.getByRole("heading", { name: "Chart of Accounts" })
    ).toBeVisible({ timeout: 30_000 })
  })

  test("shows report summaries and marks the report nav item active", async ({
    page,
  }) => {
    await expect(page.getByText("Total Assets").first()).toBeVisible()
    await expect(page.getByText("₹2,500.00").first()).toBeVisible()
    await expect(page.getByText("₹800.00").first()).toBeVisible()
    await expect(page.getByText("₹7,000.00").first()).toBeVisible()
    await expect(page.getByText("₹3,200.00").first()).toBeVisible()
    await expectActiveReportLink(page, "Chart of Accounts")
  })

  test("supports expand collapse, search, and account type filtering", async ({
    page,
  }) => {
    await expect(page.getByText("Axis Bank E2E")).not.toBeVisible()

    await toggleAccountGroup(page, "Current Assets")
    await toggleAccountGroup(page, "Bank Accounts")
    await expect(page.getByText("Axis Bank E2E")).toBeVisible()

    await page.getByPlaceholder("Search accounts, groups, or codes").fill("axis")
    await page.waitForTimeout(350)
    await expect(page.getByText("Axis Bank E2E")).toBeVisible()
    await expect(page.getByText("Current Assets")).toBeVisible()
    await expect(page.getByText("Retail Sales E2E")).not.toBeVisible()

    await selectToolbarOption(page, 0, "income")
    await page.waitForTimeout(350)
    await expect(
      page.getByText("No account groups or accounts match the current filters.")
    ).toBeVisible()

    await page.getByPlaceholder("Search accounts, groups, or codes").fill("")
    await page.waitForTimeout(350)
    await selectToolbarOption(page, 0, "All account types")
    await expect(page.getByText("Income", { exact: true })).toBeVisible()
  })
})

test.describe("Reports — Parties", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${companySlug}/parties`)
    await expect(page.getByRole("cell", { name: "Acme Retail E2E" })).toBeVisible({
      timeout: 30_000,
    })
  })

  test("shows party summaries and expandable detail", async ({ page }) => {
    const totalPartiesCard = page.getByText("Total Parties").first().locator("..")
    await expect(totalPartiesCard).toBeVisible()
    await expect(totalPartiesCard.getByText("3", { exact: true })).toBeVisible()
    await expectActiveReportLink(page, "Parties")

    await page.getByRole("row", { name: /Acme Retail E2E/ }).click()
    await expect(page.getByText("Acme Retail Private Limited")).toBeVisible()
    await expect(page.getByText("ABCDE1234F", { exact: true })).toBeVisible()
    await expect(page.getByText("12 Market Road, Pune, Maharashtra, 411001")).toBeVisible()
    await expect(page.getByText("regime: GST Regular")).toBeVisible()
  })

  test("filters by search, type, and status", async ({ page }) => {
    await page.getByPlaceholder("Search name, phone, email, or GSTIN").fill("universal")
    await page.waitForTimeout(350)
    await expect(page.getByRole("cell", { name: "Universal Traders E2E" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "Acme Retail E2E" })).not.toBeVisible()

    await page.getByPlaceholder("Search name, phone, email, or GSTIN").fill("")
    await page.waitForTimeout(350)
    await selectToolbarOption(page, 0, "Supplier")
    await expect(page.getByRole("cell", { name: "Supply Hub E2E" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "Acme Retail E2E" })).not.toBeVisible()

    await selectToolbarOption(page, 1, "Inactive")
    await expect(page.getByText("No parties match the current filters.")).toBeVisible()

    await selectToolbarOption(page, 1, "All statuses")
    await expect(page.getByRole("cell", { name: "Supply Hub E2E" })).toBeVisible()
  })
})

test.describe("Reports — Items", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${companySlug}/items`)
    await expect(page.getByRole("cell", { name: "Copper Wire E2E" })).toBeVisible({
      timeout: 30_000,
    })
  })

  test("shows item summaries and low-stock highlighting", async ({ page }) => {
    await expect(page.getByText("Total Items").first()).toBeVisible()
    await expect(page.getByText("₹3,500.00").first()).toBeVisible()
    await expect(page.getByText("1").first()).toBeVisible()
    await expectActiveReportLink(page, "Items")

    await expect(
      page.getByRole("row", { name: /Copper Wire E2E/ })
    ).toHaveClass(/bg-amber-50/)
  })

  test("filters by category, brand, item type, stock, and search", async ({
    page,
  }) => {
    await selectToolbarOption(page, 0, "Electrical")
    await expect(page.getByRole("cell", { name: "Copper Wire E2E" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "Installation Service E2E" })).not.toBeVisible()

    await selectToolbarOption(page, 1, "VoltPro")
    await expect(page.getByRole("cell", { name: "Copper Wire E2E" })).toBeVisible()
    await expect(page.getByText("LED Bulb E2E")).not.toBeVisible()

    await selectToolbarOption(page, 3, "Low stock")
    await expect(page.getByRole("cell", { name: "Copper Wire E2E" })).toBeVisible()

    await selectToolbarOption(page, 3, "Out of stock")
    await expect(page.getByRole("cell", { name: "Copper Wire E2E" })).not.toBeVisible()

    await selectToolbarOption(page, 0, "All categories")
    await selectToolbarOption(page, 1, "All brands")
    await selectToolbarOption(page, 3, "All stock")

    await page.getByPlaceholder("Search name, code, or HSN code").fill("9987")
    await page.waitForTimeout(350)
    await expect(page.getByRole("cell", { name: "Installation Service E2E" })).toBeVisible()
    await expect(page.getByRole("cell", { name: "Copper Wire E2E" })).not.toBeVisible()
  })
})
