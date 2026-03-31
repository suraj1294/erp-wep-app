import { and, asc, desc, eq, inArray, sql } from "drizzle-orm"
import { db } from "../client"
import {
  accountGroups,
  accounts,
  items,
  parties,
  stockMovements,
  unitsOfMeasure,
  voucherItems,
  vouchers,
  voucherTypes,
} from "../schema"

const CASH_BANK_CODES = ["CASH-GRP", "BANK-GRP"]

export interface ItemLineInput {
  itemId: string
  description: string
  quantity: number
  rate: number
  taxRate: number
}

export interface AccountLineInput {
  accountId: string
  description: string
  amount: number
  debitAmount: number
  creditAmount: number
}

export interface CreateVoucherInput {
  voucherTypeId: string
  voucherClass: string
  voucherDate: string
  referenceNumber?: string
  partyId?: string
  narration?: string
  dueDate?: string
  itemLines?: ItemLineInput[]
  accountLines?: AccountLineInput[]
  balancingAccountId?: string
}

function buildItemBasedEntries(
  input: CreateVoucherInput,
  partyAccountId: string | null,
  salesAccountId: string | null,
  gstOutputAccountId: string | null,
  gstInputAccountId: string | null
) {
  const lines = input.itemLines ?? []
  const isSalesType =
    input.voucherClass === "sales" || input.voucherClass === "credit_note"

  let subtotal = 0
  const taxMap: Record<number, number> = {}

  for (const line of lines) {
    const lineSubtotal = line.quantity * line.rate
    subtotal += lineSubtotal
    const taxAmt = (lineSubtotal * line.taxRate) / 100
    taxMap[line.taxRate] = (taxMap[line.taxRate] ?? 0) + taxAmt
  }

  const totalTax = Object.values(taxMap).reduce((a, b) => a + b, 0)
  const grandTotal = subtotal + totalTax

  const entries: Array<{
    accountId: string | null
    itemId: string | null
    description: string
    quantity: number | null
    rate: number | null
    debitAmount: number
    creditAmount: number
    lineNumber: number
  }> = []

  let lineNum = 1

  for (const line of lines) {
    entries.push({
      accountId: isSalesType ? salesAccountId : null,
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      rate: line.rate,
      debitAmount: isSalesType ? 0 : line.quantity * line.rate,
      creditAmount: isSalesType ? line.quantity * line.rate : 0,
      lineNumber: lineNum++,
    })
  }

  for (const [rateStr, taxAmt] of Object.entries(taxMap)) {
    if (taxAmt === 0) continue
    const taxAccountId = isSalesType ? gstOutputAccountId : gstInputAccountId
    entries.push({
      accountId: taxAccountId,
      itemId: null,
      description: `GST @ ${rateStr}%`,
      quantity: null,
      rate: null,
      debitAmount: isSalesType ? 0 : taxAmt,
      creditAmount: isSalesType ? taxAmt : 0,
      lineNumber: lineNum++,
    })
  }

  if (partyAccountId) {
    entries.push({
      accountId: partyAccountId,
      itemId: null,
      description: "",
      quantity: null,
      rate: null,
      debitAmount: isSalesType ? grandTotal : 0,
      creditAmount: isSalesType ? 0 : grandTotal,
      lineNumber: lineNum++,
    })
  }

  return { entries, grandTotal }
}

async function listCashBankAccounts(companyId: string) {
  const cashBankGroups = await db
    .select({ id: accountGroups.id })
    .from(accountGroups)
    .where(
      and(
        eq(accountGroups.companyId, companyId),
        inArray(accountGroups.code, CASH_BANK_CODES)
      )
    )

  const cashBankGroupIds = cashBankGroups.map((group) => group.id)

  if (cashBankGroupIds.length === 0) {
    return []
  }

  return db
    .select({
      id: accounts.id,
      name: accounts.name,
      code: accounts.code,
      groupName: accountGroups.name,
    })
    .from(accounts)
    .leftJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
    .where(
      and(
        eq(accounts.companyId, companyId),
        eq(accounts.isActive, true),
        inArray(accounts.groupId, cashBankGroupIds)
      )
    )
    .orderBy(asc(accounts.name))
}

export async function listVoucherRowsByClass(
  companyId: string,
  voucherClass: string
) {
  const types = await db
    .select({ id: voucherTypes.id })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        eq(voucherTypes.voucherClass, voucherClass)
      )
    )

  const typeIds = types.map((type) => type.id)
  if (typeIds.length === 0) {
    return []
  }

  const rows = await db
    .select({
      id: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      totalAmount: vouchers.totalAmount,
      status: vouchers.status,
      partyName: parties.name,
    })
    .from(vouchers)
    .leftJoin(parties, eq(vouchers.partyId, parties.id))
    .where(
      and(
        eq(vouchers.companyId, companyId),
        inArray(vouchers.voucherTypeId, typeIds)
      )
    )
    .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))

  return rows.map((row) => ({ ...row, partyName: row.partyName ?? null }))
}

export async function listBankingVouchersForClass(
  companyId: string,
  voucherClass: string
) {
  const types = await db
    .select({ id: voucherTypes.id, name: voucherTypes.name })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        eq(voucherTypes.voucherClass, voucherClass)
      )
    )

  const typeIds = types.map((type) => type.id)
  if (typeIds.length === 0) {
    return []
  }

  const typeNameMap: Record<string, string> = {}
  for (const type of types) {
    typeNameMap[type.id] = type.name
  }

  const rows = await db
    .select({
      id: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      totalAmount: vouchers.totalAmount,
      status: vouchers.status,
      partyName: parties.name,
      voucherTypeId: vouchers.voucherTypeId,
    })
    .from(vouchers)
    .leftJoin(parties, eq(vouchers.partyId, parties.id))
    .where(
      and(
        eq(vouchers.companyId, companyId),
        inArray(vouchers.voucherTypeId, typeIds)
      )
    )
    .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))

  return rows.map((row) => ({
    ...row,
    partyName: row.partyName ?? null,
    voucherTypeName: typeNameMap[row.voucherTypeId] ?? voucherClass,
  }))
}

export async function getItemVoucherFormData(
  companyId: string,
  voucherClass: "sales" | "purchase" | "credit_note" | "debit_note"
) {
  const [voucherTypeRows, partyRows, itemRows, accountRows] = await Promise.all([
    db
      .select({
        id: voucherTypes.id,
        name: voucherTypes.name,
        prefix: voucherTypes.prefix,
        currentNumber: voucherTypes.currentNumber,
      })
      .from(voucherTypes)
      .where(
        and(
          eq(voucherTypes.companyId, companyId),
          eq(voucherTypes.voucherClass, voucherClass),
          eq(voucherTypes.isActive, true)
        )
      )
      .orderBy(asc(voucherTypes.name)),
    db
      .select({
        id: parties.id,
        name: parties.name,
        displayName: parties.displayName,
        type: parties.type,
        accountId: parties.accountId,
        gstin: parties.gstin,
      })
      .from(parties)
      .where(and(eq(parties.companyId, companyId), eq(parties.isActive, true)))
      .orderBy(asc(parties.name)),
    db
      .select({
        id: items.id,
        name: items.name,
        code: items.code,
        salesRate: items.salesRate,
        purchaseRate: items.purchaseRate,
        taxRate: items.taxRate,
        unitId: items.unitId,
      })
      .from(items)
      .where(and(eq(items.companyId, companyId), eq(items.isActive, true)))
      .orderBy(asc(items.name)),
    db
      .select({
        id: accounts.id,
        name: accounts.name,
        code: accounts.code,
        groupName: accountGroups.name,
      })
      .from(accounts)
      .leftJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
      .where(and(eq(accounts.companyId, companyId), eq(accounts.isActive, true)))
      .orderBy(asc(accounts.name)),
  ])

  const itemUnitIds = [...new Set(itemRows.map((item) => item.unitId).filter(Boolean))]
  const unitMap: Record<string, string> = {}

  if (itemUnitIds.length > 0) {
    const unitRows = await db
      .select({ id: unitsOfMeasure.id, symbol: unitsOfMeasure.symbol })
      .from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.companyId, companyId))

    for (const unit of unitRows) {
      if (unit.symbol) {
        unitMap[unit.id] = unit.symbol
      }
    }
  }

  const itemsWithUnits = itemRows.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    salesRate: item.salesRate,
    purchaseRate: item.purchaseRate,
    taxRate: item.taxRate,
    unitSymbol: item.unitId ? (unitMap[item.unitId] ?? null) : null,
  }))

  const partiesForClass = partyRows.filter((party) =>
    voucherClass === "sales" || voucherClass === "credit_note"
      ? party.type === "customer" || party.type === "both"
      : party.type === "supplier" || party.type === "both"
  )

  return {
    voucherTypes: voucherTypeRows.map((voucherType) => ({
      ...voucherType,
      currentNumber: voucherType.currentNumber ?? 1,
    })),
    parties: partiesForClass,
    items: itemsWithUnits,
    accounts: accountRows,
  }
}

export async function getAccountVoucherFormData(
  companyId: string,
  voucherClass: "payment" | "receipt" | "contra" | "journal"
) {
  const [voucherTypeRows, partyRows, accountRows, cashBankAccounts] =
    await Promise.all([
      db
        .select({
          id: voucherTypes.id,
          name: voucherTypes.name,
          prefix: voucherTypes.prefix,
          currentNumber: voucherTypes.currentNumber,
        })
        .from(voucherTypes)
        .where(
          and(
            eq(voucherTypes.companyId, companyId),
            eq(voucherTypes.voucherClass, voucherClass),
            eq(voucherTypes.isActive, true)
          )
        )
        .orderBy(asc(voucherTypes.name)),
      voucherClass === "contra"
        ? Promise.resolve([] as Array<{
            id: string
            name: string
            displayName: string | null
            type: string
            accountId: string | null
            gstin: string | null
          }>)
        : db
            .select({
              id: parties.id,
              name: parties.name,
              displayName: parties.displayName,
              type: parties.type,
              accountId: parties.accountId,
              gstin: parties.gstin,
            })
            .from(parties)
            .where(and(eq(parties.companyId, companyId), eq(parties.isActive, true)))
            .orderBy(asc(parties.name)),
      db
        .select({
          id: accounts.id,
          name: accounts.name,
          code: accounts.code,
          groupName: accountGroups.name,
        })
        .from(accounts)
        .leftJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
        .where(and(eq(accounts.companyId, companyId), eq(accounts.isActive, true)))
        .orderBy(asc(accounts.name)),
      listCashBankAccounts(companyId),
    ])

  const resolvedCashBankAccounts =
    voucherClass === "contra"
      ? cashBankAccounts.length > 0
        ? cashBankAccounts
        : accountRows
      : cashBankAccounts.length > 0
        ? cashBankAccounts
        : accountRows

  return {
    voucherTypes: voucherTypeRows.map((voucherType) => ({
      ...voucherType,
      currentNumber: voucherType.currentNumber ?? 1,
    })),
    parties: partyRows,
    accounts: voucherClass === "contra" ? resolvedCashBankAccounts : accountRows,
    cashBankAccounts: resolvedCashBankAccounts,
  }
}

export async function createVoucher(
  companyId: string,
  userId: string,
  input: CreateVoucherInput
) {
  if (!input.voucherTypeId) throw new Error("Voucher type is required")
  if (!input.voucherDate) throw new Error("Voucher date is required")

  return db.transaction(async (tx) => {
    const [voucherType] = await tx
      .select()
      .from(voucherTypes)
      .where(
        and(
          eq(voucherTypes.id, input.voucherTypeId),
          eq(voucherTypes.companyId, companyId)
        )
      )
      .for("update")

    if (!voucherType) throw new Error("Voucher type not found")
    if (!voucherType.isActive) throw new Error("Voucher type is inactive")

    const currentNumber = voucherType.currentNumber ?? 1
    const voucherNumber = `${voucherType.prefix ?? voucherType.code}-${String(
      currentNumber
    ).padStart(4, "0")}`

    await tx
      .update(voucherTypes)
      .set({ currentNumber: currentNumber + 1 })
      .where(eq(voucherTypes.id, voucherType.id))

    let partyAccountId: string | null = null
    if (input.partyId) {
      const [party] = await tx
        .select({ accountId: parties.accountId })
        .from(parties)
        .where(and(eq(parties.id, input.partyId), eq(parties.companyId, companyId)))

      partyAccountId = party?.accountId ?? null
    }

    const [salesAccount] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.code, "SALES")))

    const [purchaseAccount] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.code, "PURCHASE")))

    const [gstOutput] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.code, "GST-OUTPUT")))

    const [gstInput] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.code, "GST-INPUT")))

    let entries: Array<{
      accountId: string | null
      itemId: string | null
      description: string
      quantity: number | null
      rate: number | null
      debitAmount: number
      creditAmount: number
      lineNumber: number
    }> = []

    let totalAmount = 0

    const isItemBased = ["sales", "purchase", "credit_note", "debit_note"].includes(
      input.voucherClass
    )

    if (isItemBased) {
      const isSalesType =
        input.voucherClass === "sales" || input.voucherClass === "credit_note"
      const defaultSalesOrPurchaseId = isSalesType
        ? salesAccount?.id ?? null
        : purchaseAccount?.id ?? null

      const builtEntries = buildItemBasedEntries(
        input,
        partyAccountId,
        defaultSalesOrPurchaseId,
        gstOutput?.id ?? null,
        gstInput?.id ?? null
      )

      entries = builtEntries.entries
      totalAmount = builtEntries.grandTotal
    } else {
      const lines = input.accountLines ?? []
      let lineNum = 1

      for (const line of lines) {
        entries.push({
          accountId: line.accountId,
          itemId: null,
          description: line.description,
          quantity: null,
          rate: null,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          lineNumber: lineNum++,
        })
        totalAmount += line.debitAmount
      }

      if (
        input.balancingAccountId &&
        (input.voucherClass === "payment" || input.voucherClass === "receipt")
      ) {
        const isPayment = input.voucherClass === "payment"
        entries.push({
          accountId: input.balancingAccountId,
          itemId: null,
          description: "",
          quantity: null,
          rate: null,
          debitAmount: isPayment ? 0 : totalAmount,
          creditAmount: isPayment ? totalAmount : 0,
          lineNumber: lineNum++,
        })
      }
    }

    const [voucher] = await tx
      .insert(vouchers)
      .values({
        companyId,
        voucherTypeId: input.voucherTypeId,
        voucherNumber,
        referenceNumber: input.referenceNumber || null,
        voucherDate: input.voucherDate,
        partyId: input.partyId || null,
        narration: input.narration || null,
        totalAmount: String(totalAmount),
        dueDate: input.dueDate || null,
        createdBy: userId,
        status: "active",
      })
      .returning({ id: vouchers.id, voucherNumber: vouchers.voucherNumber })

    if (!voucher) {
      throw new Error("Failed to create voucher")
    }

    if (entries.length > 0) {
      await tx.insert(voucherItems).values(
        entries.map((entry) => ({
          voucherId: voucher.id,
          accountId: entry.accountId,
          itemId: entry.itemId,
          description: entry.description,
          quantity: entry.quantity !== null ? String(entry.quantity) : null,
          rate: entry.rate !== null ? String(entry.rate) : null,
          debitAmount: String(entry.debitAmount),
          creditAmount: String(entry.creditAmount),
          lineNumber: entry.lineNumber,
        }))
      )
    }

    if (isItemBased) {
      const itemLines = input.itemLines ?? []
      const isSalesType =
        input.voucherClass === "sales" || input.voucherClass === "credit_note"

      for (const line of itemLines) {
        if (!line.itemId) continue

        const movementType =
          input.voucherClass === "sales"
            ? "sale_out"
            : input.voucherClass === "purchase"
              ? "purchase_in"
              : input.voucherClass === "credit_note"
                ? "credit_note_in"
                : "debit_note_out"

        const qty = isSalesType ? -line.quantity : line.quantity
        const lineValue = line.quantity * line.rate

        await tx.insert(stockMovements).values({
          companyId,
          itemId: line.itemId,
          voucherId: voucher.id,
          movementType,
          quantity: String(Math.abs(line.quantity)),
          rate: String(line.rate),
          value: String(lineValue),
        })

        await tx
          .update(items)
          .set({
            currentStock: sql`${items.currentStock} + ${qty}`,
          })
          .where(and(eq(items.id, line.itemId), eq(items.companyId, companyId)))
      }
    }

    for (const entry of entries) {
      if (!entry.accountId) continue
      const netChange = entry.debitAmount - entry.creditAmount
      if (netChange === 0) continue

      await tx
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${netChange}`,
        })
        .where(and(eq(accounts.id, entry.accountId), eq(accounts.companyId, companyId)))
    }

    return { voucherId: voucher.id, voucherNumber: voucher.voucherNumber }
  })
}

export async function cancelVoucher(companyId: string, voucherId: string) {
  await db.transaction(async (tx) => {
    const [voucher] = await tx
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))

    if (!voucher) throw new Error("Voucher not found")
    if (voucher.status === "cancelled") throw new Error("Already cancelled")

    const existingItems = await tx
      .select()
      .from(voucherItems)
      .where(eq(voucherItems.voucherId, voucherId))

    for (const item of existingItems) {
      if (!item.accountId) continue
      const reversal = Number(item.creditAmount) - Number(item.debitAmount)
      if (reversal === 0) continue

      await tx
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${reversal}`,
        })
        .where(and(eq(accounts.id, item.accountId), eq(accounts.companyId, companyId)))
    }

    const stockItems = existingItems.filter((item) => item.itemId !== null)
    for (const item of stockItems) {
      if (!item.itemId) continue
      const originalQuantity = Number(item.quantity ?? 0)
      const reversal = -originalQuantity

      await tx
        .update(items)
        .set({ currentStock: sql`${items.currentStock} + ${reversal}` })
        .where(and(eq(items.id, item.itemId), eq(items.companyId, companyId)))
    }

    await tx
      .update(vouchers)
      .set({ status: "cancelled" })
      .where(eq(vouchers.id, voucherId))
  })
}

export async function getVouchersByClass(
  companyId: string,
  voucherClasses: string[]
) {
  const types = await db
    .select({ id: voucherTypes.id, voucherClass: voucherTypes.voucherClass })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        inArray(voucherTypes.voucherClass, voucherClasses)
      )
    )

  if (types.length === 0) {
    return []
  }

  const typeIds = types.map((type) => type.id)

  return db
    .select({
      id: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      referenceNumber: vouchers.referenceNumber,
      totalAmount: vouchers.totalAmount,
      status: vouchers.status,
      narration: vouchers.narration,
      partyId: vouchers.partyId,
      voucherTypeId: vouchers.voucherTypeId,
      partyName: parties.name,
      voucherTypeName: voucherTypes.name,
      voucherClass: voucherTypes.voucherClass,
    })
    .from(vouchers)
    .leftJoin(parties, eq(vouchers.partyId, parties.id))
    .leftJoin(voucherTypes, eq(vouchers.voucherTypeId, voucherTypes.id))
    .where(
      and(
        eq(vouchers.companyId, companyId),
        inArray(vouchers.voucherTypeId, typeIds)
      )
    )
    .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))
}

export async function getVoucherDetail(companyId: string, voucherId: string) {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      voucherNumber: vouchers.voucherNumber,
      voucherDate: vouchers.voucherDate,
      referenceNumber: vouchers.referenceNumber,
      totalAmount: vouchers.totalAmount,
      status: vouchers.status,
      narration: vouchers.narration,
      dueDate: vouchers.dueDate,
      partyId: vouchers.partyId,
      partyName: parties.name,
      voucherTypeId: vouchers.voucherTypeId,
      voucherTypeName: voucherTypes.name,
      voucherClass: voucherTypes.voucherClass,
    })
    .from(vouchers)
    .leftJoin(parties, eq(vouchers.partyId, parties.id))
    .leftJoin(voucherTypes, eq(vouchers.voucherTypeId, voucherTypes.id))
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))

  if (!voucher) {
    return null
  }

  const lineItems = await db
    .select({
      id: voucherItems.id,
      lineNumber: voucherItems.lineNumber,
      accountId: voucherItems.accountId,
      accountName: accounts.name,
      itemId: voucherItems.itemId,
      itemName: items.name,
      description: voucherItems.description,
      quantity: voucherItems.quantity,
      rate: voucherItems.rate,
      debitAmount: voucherItems.debitAmount,
      creditAmount: voucherItems.creditAmount,
    })
    .from(voucherItems)
    .leftJoin(accounts, eq(voucherItems.accountId, accounts.id))
    .leftJoin(items, eq(voucherItems.itemId, items.id))
    .where(eq(voucherItems.voucherId, voucherId))
    .orderBy(voucherItems.lineNumber)

  return { ...voucher, lineItems }
}
