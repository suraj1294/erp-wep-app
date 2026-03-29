import { test, expect, type Page, type Locator } from "@playwright/test"
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

const { and, eq, inArray } = await import("drizzle-orm")
const { db } = await import("@workspace/db/client")
const {
  accounts,
  accountGroups,
  companies,
  companyUsers,
  items,
  parties,
  voucherItems,
  vouchers,
  unitsOfMeasure,
  user,
} = await import("@workspace/db/schema")
const { seedCompanyDefaults } = await import(
  "@workspace/db/seeds/company-defaults"
)

const E2E_EMAIL = process.env.E2E_EMAIL ?? "suraz.patil@gmail.com"

const FIXTURE_NAMES = {
  company: `Voucher E2E ${Date.now()}`,
  bankAccount: `E2E Bank ${Date.now()}`,
  customerAccount: `E2E Customer Ledger ${Date.now()}`,
  supplierAccount: `E2E Supplier Ledger ${Date.now()}`,
  customerParty: `E2E Customer ${Date.now()}`,
  supplierParty: `E2E Supplier ${Date.now()}`,
  item: `E2E Widget ${Date.now()}`,
}

async function createVoucherFixtureCompany(): Promise<string> {
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
      name: FIXTURE_NAMES.company,
      displayName: FIXTURE_NAMES.company,
      createdBy: owner.id,
    })
    .returning({ id: companies.id })

  if (!company) {
    throw new Error("Failed to create voucher test company")
  }

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: owner.id,
    role: "owner",
  })

  await seedCompanyDefaults(company.id)

  const groups = await db
    .select({ id: accountGroups.id, code: accountGroups.code })
    .from(accountGroups)
    .where(eq(accountGroups.companyId, company.id))

  const groupIdByCode = new Map(
    groups
      .filter((g) => g.code)
      .map((g) => [g.code!, g.id])
  )

  const debtGroupId = groupIdByCode.get("DEBT")
  const creditGroupId = groupIdByCode.get("CRED")
  const bankGroupId = groupIdByCode.get("BANK-GRP")
  if (!debtGroupId || !creditGroupId || !bankGroupId) {
    throw new Error("Seeded account groups missing required banking or party groups")
  }

  await db.insert(accounts).values({
    companyId: company.id,
    groupId: bankGroupId,
    name: FIXTURE_NAMES.bankAccount,
    code: `E2E-BANK-${Date.now()}`,
    openingBalance: "0",
    currentBalance: "0",
  })

  const [customerAccount] = await db
    .insert(accounts)
    .values({
      companyId: company.id,
      groupId: debtGroupId,
      name: FIXTURE_NAMES.customerAccount,
      code: `E2E-CUST-${Date.now()}`,
      openingBalance: "0",
      currentBalance: "0",
    })
    .returning({ id: accounts.id })

  const [supplierAccount] = await db
    .insert(accounts)
    .values({
      companyId: company.id,
      groupId: creditGroupId,
      name: FIXTURE_NAMES.supplierAccount,
      code: `E2E-SUP-${Date.now()}`,
      openingBalance: "0",
      currentBalance: "0",
    })
    .returning({ id: accounts.id })

  const [baseUnit] = await db
    .select({ id: unitsOfMeasure.id })
    .from(unitsOfMeasure)
    .where(
      and(
        eq(unitsOfMeasure.companyId, company.id),
        eq(unitsOfMeasure.isBaseUnit, true)
      )
    )

  await db.insert(parties).values([
    {
      companyId: company.id,
      accountId: customerAccount!.id,
      type: "customer",
      name: FIXTURE_NAMES.customerParty,
      displayName: FIXTURE_NAMES.customerParty,
    },
    {
      companyId: company.id,
      accountId: supplierAccount!.id,
      type: "supplier",
      name: FIXTURE_NAMES.supplierParty,
      displayName: FIXTURE_NAMES.supplierParty,
    },
  ])

  await db.insert(items).values({
    companyId: company.id,
    name: FIXTURE_NAMES.item,
    code: `E2E-ITEM-${Date.now()}`,
    unitId: baseUnit?.id ?? null,
    purchaseRate: "80.00",
    salesRate: "120.00",
    taxRate: "18.00",
    currentStock: "10.000",
  })

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

  await db.delete(companies).where(eq(companies.id, companyId))
}

function formArea(page: Page) {
  return page.locator('[data-slot="sidebar-inset"]')
}

function voucherComboboxes(page: Page) {
  return formArea(page).getByRole("combobox")
}

async function selectCommandOption(
  page: Page,
  combobox: Locator,
  optionText: string
) {
  await combobox.click()
  const option = page
    .locator('[data-slot="command-item"]:visible')
    .filter({ hasText: optionText })
    .first()
  await option.waitFor({ timeout: 10_000 })
  await option.click()
}

async function saveVoucher(page: Page, expectedPath: string) {
  await formArea(page).getByRole("button", { name: /^Save$/ }).first().click()
  await page.waitForURL(
    (url) => url.pathname === expectedPath,
    { timeout: 30_000 }
  )
}

async function expectVoucherCreated(
  page: Page,
  voucherNumber: string,
  partyName?: string
) {
  await expect(page.getByRole("cell", { name: voucherNumber, exact: true })).toBeVisible()

  if (partyName) {
    await expect(page.getByRole("cell", { name: partyName, exact: true })).toBeVisible()
  }
}

test.describe("Voucher create flows", () => {
  let companyId: string

  test.beforeAll(async () => {
    companyId = await createVoucherFixtureCompany()
  })

  test.afterAll(async () => {
    if (companyId) {
      await deleteCompany(companyId)
    }
  })

  test("creates a sales invoice", async ({ page }) => {
    await page.goto(`/${companyId}/sales/new`)
    await expect(page.getByRole("heading", { name: "New Sales Invoice" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companyId}/sales`)
    await expectVoucherCreated(page, "INV-0001", FIXTURE_NAMES.customerParty)
  })

  test("creates a purchase bill", async ({ page }) => {
    await page.goto(`/${companyId}/purchase/new`)
    await expect(page.getByRole("heading", { name: "New Purchase Bill" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.supplierParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companyId}/purchase`)
    await expectVoucherCreated(page, "BILL-0001", FIXTURE_NAMES.supplierParty)
  })

  test("creates a credit note", async ({ page }) => {
    await page.goto(`/${companyId}/credit-notes/new`)
    await expect(page.getByRole("heading", { name: "New Credit Note" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companyId}/credit-notes`)
    await expectVoucherCreated(page, "CN-0001", FIXTURE_NAMES.customerParty)
  })

  test("creates a debit note", async ({ page }) => {
    await page.goto(`/${companyId}/debit-notes/new`)
    await expect(page.getByRole("heading", { name: "New Debit Note" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.supplierParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companyId}/debit-notes`)
    await expectVoucherCreated(page, "DN-0001", FIXTURE_NAMES.supplierParty)
  })

  test("creates a payment voucher", async ({ page }) => {
    await page.goto(`/${companyId}/banking/payment/new`)
    await expect(page.getByRole("heading", { name: "New Payment" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.bankAccount)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.supplierAccount)
    await formArea(page).locator('input[type="number"]').first().fill("50")

    await saveVoucher(page, `/${companyId}/banking`)
    await expectVoucherCreated(page, "PMT-0001")
  })

  test("creates a receipt voucher", async ({ page }) => {
    await page.goto(`/${companyId}/banking/receipt/new`)
    await expect(page.getByRole("heading", { name: "New Receipt" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.bankAccount)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.customerAccount)
    await formArea(page).locator('input[type="number"]').first().fill("60")

    await saveVoucher(page, `/${companyId}/banking`)
    await expectVoucherCreated(page, "RCT-0001")
  })

  test("creates a contra voucher", async ({ page }) => {
    await page.goto(`/${companyId}/banking/contra/new`)
    await expect(page.getByRole("heading", { name: "New Contra Entry" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), "Cash")
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.bankAccount)

    const nums = formArea(page).locator('input[type="number"]')
    await nums.nth(0).fill("100")
    await nums.nth(3).fill("100")

    await saveVoucher(page, `/${companyId}/banking`)
    await expectVoucherCreated(page, "CON-0001")
  })

  test("creates a journal voucher", async ({ page }) => {
    await page.goto(`/${companyId}/journal/new`)
    await expect(page.getByRole("heading", { name: "New Journal Entry" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
    await selectCommandOption(page, combos.nth(1), "Purchase")
    await selectCommandOption(page, combos.nth(2), "Sales")

    const nums = formArea(page).locator('input[type="number"]')
    await nums.nth(0).fill("75")
    await nums.nth(3).fill("75")

    await saveVoucher(page, `/${companyId}/journal`)
    await expectVoucherCreated(page, "JNL-0001")
  })
})
