import { test, expect, type Page, type Locator } from "@playwright/test"
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
const { createCompanyRecord } = await import("@/lib/company-slug")

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

const EDIT_FIXTURES = {
  sales: {
    reference: `SALES-EDIT-${Date.now()}`,
    description: "Updated sales line",
    narration: "Updated sales narration",
  },
  purchase: {
    reference: `PUR-EDIT-${Date.now()}`,
    description: "Updated purchase line",
    narration: "Updated purchase narration",
  },
  creditNote: {
    reference: `CN-EDIT-${Date.now()}`,
    description: "Updated credit note line",
    narration: "Updated credit note narration",
  },
  debitNote: {
    reference: `DN-EDIT-${Date.now()}`,
    description: "Updated debit note line",
    narration: "Updated debit note narration",
  },
  payment: {
    reference: `PMT-EDIT-${Date.now()}`,
    description: "Updated payment line",
    narration: "Updated payment narration",
  },
  receipt: {
    reference: `RCT-EDIT-${Date.now()}`,
    description: "Updated receipt line",
    narration: "Updated receipt narration",
  },
  contra: {
    reference: `CON-EDIT-${Date.now()}`,
    description: "Updated contra line",
    narration: "Updated contra narration",
  },
  journal: {
    reference: `JNL-EDIT-${Date.now()}`,
    description: "Updated journal line",
    narration: "Updated journal narration",
  },
}

async function createVoucherFixtureCompany() {
  const [owner] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, E2E_EMAIL))

  if (!owner) {
    throw new Error(`E2E user not found for ${E2E_EMAIL}`)
  }

  const company = await createCompanyRecord({
    name: FIXTURE_NAMES.company,
    displayName: FIXTURE_NAMES.company,
    createdBy: owner.id,
  })

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

  return company
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
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 30_000 })
    .toBe(expectedPath)
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

async function openVoucherEditPage(
  page: Page,
  companySlug: string,
  listPath: string,
  voucherNumber: string,
  editHeading: string
) {
  await ensureVoucherExists(page, companySlug, listPath, voucherNumber)
  await page.goto(listPath)
  const row = page
    .locator("tbody tr")
    .filter({
      has: page.getByRole("cell", { name: voucherNumber, exact: true }),
    })
    .first()
  await expect(row).toBeVisible()
  const detailLink = row.getByRole("link", { name: voucherNumber, exact: true })
  const detailHref = await detailLink.getAttribute("href")
  expect(detailHref).toBeTruthy()
  await page.goto(detailHref!, { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading", { name: voucherNumber })).toBeVisible()
  const editLink = page.getByRole("link", { name: "Edit", exact: true })
  await expect(editLink).toBeVisible()
  const href = await editLink.getAttribute("href")
  expect(href).toBeTruthy()
  await page.goto(href!, { waitUntil: "domcontentloaded" })
  await expect
    .poll(() => new URL(page.url()).pathname, { timeout: 15_000 })
    .toMatch(/\/edit$/)
  await expect(page.getByRole("heading", { name: editHeading })).toBeVisible()
  await expect(
    formArea(page).getByRole("button", { name: "Save Changes" }).first()
  ).toBeVisible()
}

async function saveEditedVoucher(page: Page, expectedPathFragment: string) {
  await formArea(page)
    .getByRole("button", { name: "Save Changes" })
    .first()
    .click()
  await expect
    .poll(() => {
      const pathname = new URL(page.url()).pathname
      return (
        pathname.includes(expectedPathFragment) && !pathname.endsWith("/edit")
      )
    }, { timeout: 30_000 })
    .toBe(true)
}

async function updateCommonVoucherFields(
  page: Page,
  reference: string,
  description: string,
  narration: string
) {
  await page.getByPlaceholder("e.g. PO-001").fill(reference)
  await page.getByPlaceholder("Description").first().fill(description)
  await page.getByPlaceholder("Optional description / memo").fill(narration)
}

async function ensureVoucherExists(
  page: Page,
  companySlug: string,
  listPath: string,
  voucherNumber: string
) {
  await page.goto(listPath)

  const voucherCell = page.getByRole("cell", {
    name: voucherNumber,
    exact: true,
  })

  const exists = await voucherCell
    .waitFor({ state: "visible", timeout: 2_000 })
    .then(() => true)
    .catch(() => false)

  if (exists) {
    return
  }

  switch (voucherNumber) {
    case "INV-0001": {
      await page.goto(`/${companySlug}/sales/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)
      await saveVoucher(page, `/${companySlug}/sales`)
      break
    }
    case "BILL-0001": {
      await page.goto(`/${companySlug}/purchase/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.supplierParty)
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)
      await saveVoucher(page, `/${companySlug}/purchase`)
      break
    }
    case "CN-0001": {
      await page.goto(`/${companySlug}/credit-notes/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)
      await saveVoucher(page, `/${companySlug}/credit-notes`)
      break
    }
    case "DN-0001": {
      await page.goto(`/${companySlug}/debit-notes/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.supplierParty)
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)
      await saveVoucher(page, `/${companySlug}/debit-notes`)
      break
    }
    case "PMT-0001": {
      await page.goto(`/${companySlug}/banking/payment/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.bankAccount)
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.supplierAccount)
      await formArea(page).locator('input[type="number"]').first().fill("50")
      await saveVoucher(page, `/${companySlug}/banking`)
      break
    }
    case "RCT-0001": {
      await page.goto(`/${companySlug}/banking/receipt/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.bankAccount)
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.customerAccount)
      await formArea(page).locator('input[type="number"]').first().fill("60")
      await saveVoucher(page, `/${companySlug}/banking`)
      break
    }
    case "CON-0001": {
      await page.goto(`/${companySlug}/banking/contra/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), "Cash")
      await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.bankAccount)
      const nums = formArea(page).locator('input[type="number"]')
      await nums.nth(0).fill("100")
      await nums.nth(3).fill("100")
      await saveVoucher(page, `/${companySlug}/banking`)
      break
    }
    case "JNL-0001": {
      await page.goto(`/${companySlug}/journal/new`)
      const combos = voucherComboboxes(page)
      await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
      await selectCommandOption(page, combos.nth(1), "Purchase")
      await selectCommandOption(page, combos.nth(2), "Sales")
      const nums = formArea(page).locator('input[type="number"]')
      await nums.nth(0).fill("75")
      await nums.nth(3).fill("75")
      await saveVoucher(page, `/${companySlug}/journal`)
      break
    }
    default:
      throw new Error(`Unsupported voucher bootstrap for ${voucherNumber}`)
  }
}

test.describe("Voucher create flows", () => {
  test.describe.configure({ timeout: 90_000 })

  let companyId: string
  let companySlug: string

  test.beforeAll(async () => {
    const company = await createVoucherFixtureCompany()
    companyId = company.id
    companySlug = company.slug
  })

  test.afterAll(async () => {
    if (companyId) {
      await deleteCompany(companyId)
    }
  })

  test("creates a sales invoice", async ({ page }) => {
    await page.goto(`/${companySlug}/sales/new`)
    await expect(page.getByRole("heading", { name: "New Sales Invoice" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companySlug}/sales`)
    await expectVoucherCreated(page, "INV-0001", FIXTURE_NAMES.customerParty)
  })

  test("creates a purchase bill", async ({ page }) => {
    await page.goto(`/${companySlug}/purchase/new`)
    await expect(page.getByRole("heading", { name: "New Purchase Bill" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.supplierParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companySlug}/purchase`)
    await expectVoucherCreated(page, "BILL-0001", FIXTURE_NAMES.supplierParty)
  })

  test("creates a credit note", async ({ page }) => {
    await page.goto(`/${companySlug}/credit-notes/new`)
    await expect(page.getByRole("heading", { name: "New Credit Note" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companySlug}/credit-notes`)
    await expectVoucherCreated(page, "CN-0001", FIXTURE_NAMES.customerParty)
  })

  test("creates a debit note", async ({ page }) => {
    await page.goto(`/${companySlug}/debit-notes/new`)
    await expect(page.getByRole("heading", { name: "New Debit Note" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.supplierParty)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.item)

    await saveVoucher(page, `/${companySlug}/debit-notes`)
    await expectVoucherCreated(page, "DN-0001", FIXTURE_NAMES.supplierParty)
  })

  test("creates a payment voucher", async ({ page }) => {
    await page.goto(`/${companySlug}/banking/payment/new`)
    await expect(page.getByRole("heading", { name: "New Payment" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.bankAccount)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.supplierAccount)
    await formArea(page).locator('input[type="number"]').first().fill("50")

    await saveVoucher(page, `/${companySlug}/banking`)
    await expectVoucherCreated(page, "PMT-0001")
  })

  test("creates a receipt voucher", async ({ page }) => {
    await page.goto(`/${companySlug}/banking/receipt/new`)
    await expect(page.getByRole("heading", { name: "New Receipt" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.bankAccount)
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.customerAccount)
    await formArea(page).locator('input[type="number"]').first().fill("60")

    await saveVoucher(page, `/${companySlug}/banking`)
    await expectVoucherCreated(page, "RCT-0001")
  })

  test("creates a contra voucher", async ({ page }) => {
    await page.goto(`/${companySlug}/banking/contra/new`)
    await expect(page.getByRole("heading", { name: "New Contra Entry" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), "Cash")
    await selectCommandOption(page, combos.nth(1), FIXTURE_NAMES.bankAccount)

    const nums = formArea(page).locator('input[type="number"]')
    await nums.nth(0).fill("100")
    await nums.nth(3).fill("100")

    await saveVoucher(page, `/${companySlug}/banking`)
    await expectVoucherCreated(page, "CON-0001")
  })

  test("creates a journal voucher", async ({ page }) => {
    await page.goto(`/${companySlug}/journal/new`)
    await expect(page.getByRole("heading", { name: "New Journal Entry" })).toBeVisible()

    const combos = voucherComboboxes(page)
    await selectCommandOption(page, combos.nth(0), FIXTURE_NAMES.customerParty)
    await selectCommandOption(page, combos.nth(1), "Purchase")
    await selectCommandOption(page, combos.nth(2), "Sales")

    const nums = formArea(page).locator('input[type="number"]')
    await nums.nth(0).fill("75")
    await nums.nth(3).fill("75")

    await saveVoucher(page, `/${companySlug}/journal`)
    await expectVoucherCreated(page, "JNL-0001")
  })

  test("edits a sales invoice from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/sales`,
      "INV-0001",
      "Edit Sales Invoice"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.sales.reference,
      EDIT_FIXTURES.sales.description,
      EDIT_FIXTURES.sales.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/sales/`)
    await expect(page.getByText(EDIT_FIXTURES.sales.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.sales.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.sales.narration)).toBeVisible()
  })

  test("edits a purchase bill from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/purchase`,
      "BILL-0001",
      "Edit Purchase Bill"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.purchase.reference,
      EDIT_FIXTURES.purchase.description,
      EDIT_FIXTURES.purchase.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/purchase/`)
    await expect(page.getByText(EDIT_FIXTURES.purchase.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.purchase.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.purchase.narration)).toBeVisible()
  })

  test("edits a credit note from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/credit-notes`,
      "CN-0001",
      "Edit Credit Note"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.creditNote.reference,
      EDIT_FIXTURES.creditNote.description,
      EDIT_FIXTURES.creditNote.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/credit-notes/`)
    await expect(page.getByText(EDIT_FIXTURES.creditNote.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.creditNote.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.creditNote.narration)).toBeVisible()
  })

  test("edits a debit note from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/debit-notes`,
      "DN-0001",
      "Edit Debit Note"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.debitNote.reference,
      EDIT_FIXTURES.debitNote.description,
      EDIT_FIXTURES.debitNote.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/debit-notes/`)
    await expect(page.getByText(EDIT_FIXTURES.debitNote.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.debitNote.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.debitNote.narration)).toBeVisible()
  })

  test("edits a payment voucher from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/banking`,
      "PMT-0001",
      "Edit Payment"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.payment.reference,
      EDIT_FIXTURES.payment.description,
      EDIT_FIXTURES.payment.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/banking/`)
    await expect(page.getByText(EDIT_FIXTURES.payment.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.payment.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.payment.narration)).toBeVisible()
  })

  test("edits a receipt voucher from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/banking`,
      "RCT-0001",
      "Edit Receipt"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.receipt.reference,
      EDIT_FIXTURES.receipt.description,
      EDIT_FIXTURES.receipt.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/banking/`)
    await expect(page.getByText(EDIT_FIXTURES.receipt.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.receipt.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.receipt.narration)).toBeVisible()
  })

  test("edits a contra voucher from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/banking`,
      "CON-0001",
      "Edit Contra Entry"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.contra.reference,
      EDIT_FIXTURES.contra.description,
      EDIT_FIXTURES.contra.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/banking/`)
    await expect(page.getByText(EDIT_FIXTURES.contra.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.contra.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.contra.narration)).toBeVisible()
  })

  test("edits a journal voucher from the detail action", async ({ page }) => {
    await openVoucherEditPage(
      page,
      companySlug,
      `/${companySlug}/journal`,
      "JNL-0001",
      "Edit Journal Entry"
    )
    await updateCommonVoucherFields(
      page,
      EDIT_FIXTURES.journal.reference,
      EDIT_FIXTURES.journal.description,
      EDIT_FIXTURES.journal.narration
    )
    await saveEditedVoucher(page, `/${companySlug}/journal/`)
    await expect(page.getByText(EDIT_FIXTURES.journal.reference)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.journal.description)).toBeVisible()
    await expect(page.getByText(EDIT_FIXTURES.journal.narration)).toBeVisible()
  })
})
