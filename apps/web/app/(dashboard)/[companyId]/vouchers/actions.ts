"use server"

import { revalidatePath } from "next/cache"
import { eq, and, desc, inArray, sql } from "drizzle-orm"
import { db } from "@workspace/db/client"
import {
  vouchers,
  voucherItems,
  voucherTypes,
  accounts,
  accountGroups,
  items,
  parties,
  stockMovements,
} from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { requireSession } from "@/lib/auth-server"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ItemLineInput {
  itemId: string
  description: string
  quantity: number
  rate: number
  taxRate: number // percentage, e.g. 18 for 18%
}

export interface AccountLineInput {
  accountId: string
  description: string
  amount: number // always positive; direction determined by debitAmount / creditAmount below
  debitAmount: number
  creditAmount: number
}

export interface CreateVoucherInput {
  voucherTypeId: string
  voucherClass: string // "sales" | "purchase" | "payment" | "receipt" | "contra" | "journal" | "credit_note" | "debit_note"
  voucherDate: string // ISO date string
  referenceNumber?: string
  partyId?: string
  narration?: string
  dueDate?: string
  // Template A (item-based): sales, purchase, credit_note, debit_note
  itemLines?: ItemLineInput[]
  // Template B/C (account-based): payment, receipt, journal, contra
  accountLines?: AccountLineInput[]
  // Template B only: the balancing cash/bank account
  balancingAccountId?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute the Sales/Purchase/CN/DN ledger entries from item lines */
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
  // For sales/CN: Dr party, Cr sales + Cr GST Output
  // For purchase/DN: Dr purchase + Dr GST Input, Cr party

  let subtotal = 0
  const taxMap: Record<number, number> = {} // taxRate% → total tax amount

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

  // User item lines
  for (const line of lines) {
    entries.push({
      accountId: isSalesType ? salesAccountId : null, // will be overridden with actual sales/purchase account
      itemId: line.itemId,
      description: line.description,
      quantity: line.quantity,
      rate: line.rate,
      debitAmount: isSalesType ? 0 : line.quantity * line.rate,
      creditAmount: isSalesType ? line.quantity * line.rate : 0,
      lineNumber: lineNum++,
    })
  }

  // Tax entries per rate
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

  // Party balancing entry
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

// ---------------------------------------------------------------------------
// createVoucher
// ---------------------------------------------------------------------------

export async function createVoucher(
  companyId: string,
  input: CreateVoucherInput
) {
  const { session } = await requireCompanyAccess(companyId)

  // Basic validation
  if (!input.voucherTypeId) throw new Error("Voucher type is required")
  if (!input.voucherDate) throw new Error("Voucher date is required")

  const result = await db.transaction(async (tx) => {
    // 1. Lock and fetch voucher type
    const [vt] = await tx
      .select()
      .from(voucherTypes)
      .where(
        and(
          eq(voucherTypes.id, input.voucherTypeId),
          eq(voucherTypes.companyId, companyId)
        )
      )
      .for("update")

    if (!vt) throw new Error("Voucher type not found")
    if (!vt.isActive) throw new Error("Voucher type is inactive")

    // 2. Generate voucher number
    const num = vt.currentNumber ?? 1
    const voucherNumber = `${vt.prefix ?? vt.code}-${String(num).padStart(4, "0")}`

    // 3. Increment current number
    await tx
      .update(voucherTypes)
      .set({ currentNumber: num + 1 })
      .where(eq(voucherTypes.id, vt.id))

    // 4. Resolve party account if party given
    let partyAccountId: string | null = null
    let partyAccountNature: string | null = null
    if (input.partyId) {
      const [party] = await tx
        .select({ accountId: parties.accountId })
        .from(parties)
        .where(
          and(
            eq(parties.id, input.partyId),
            eq(parties.companyId, companyId)
          )
        )
      partyAccountId = party?.accountId ?? null
    }

    // 5. Resolve default Sales/Purchase + GST accounts (look up by code)
    const [salesAccount] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.code, "SALES")))

    const [purchaseAccount] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(eq(accounts.companyId, companyId), eq(accounts.code, "PURCHASE"))
      )

    const [gstOutput] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.companyId, companyId),
          eq(accounts.code, "GST-OUTPUT")
        )
      )

    const [gstInput] = await tx
      .select({ id: accounts.id })
      .from(accounts)
      .where(
        and(
          eq(accounts.companyId, companyId),
          eq(accounts.code, "GST-INPUT")
        )
      )

    // 6. Build voucherItem rows
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

      const { entries: built, grandTotal } = buildItemBasedEntries(
        input,
        partyAccountId,
        defaultSalesOrPurchaseId,
        gstOutput?.id ?? null,
        gstInput?.id ?? null
      )
      entries = built
      totalAmount = grandTotal
    } else {
      // Account-based (payment, receipt, journal, contra)
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
        totalAmount += line.debitAmount // track by debit side
      }

      // For payment/receipt add the balancing cash/bank entry
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
          debitAmount: isPayment ? 0 : totalAmount, // receipt: Dr cash
          creditAmount: isPayment ? totalAmount : 0, // payment: Cr cash
          lineNumber: lineNum++,
        })
      }
    }

    // 7. Insert voucher header
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
        createdBy: session.user.id,
        status: "active",
      })
      .returning({ id: vouchers.id, voucherNumber: vouchers.voucherNumber })

    if (!voucher) {
      throw new Error("Failed to create voucher")
    }

    // 8. Insert voucher items
    if (entries.length > 0) {
      await tx.insert(voucherItems).values(
        entries.map((e) => ({
          voucherId: voucher.id,
          accountId: e.accountId,
          itemId: e.itemId,
          description: e.description,
          quantity: e.quantity !== null ? String(e.quantity) : null,
          rate: e.rate !== null ? String(e.rate) : null,
          debitAmount: String(e.debitAmount),
          creditAmount: String(e.creditAmount),
          lineNumber: e.lineNumber,
        }))
      )
    }

    // 9. For item-based vouchers: update stock movements
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

        // Update item stock
        await tx
          .update(items)
          .set({
            currentStock: sql`${items.currentStock} + ${qty}`,
          })
          .where(and(eq(items.id, line.itemId), eq(items.companyId, companyId)))
      }
    }

    // 10. Update account balances
    for (const entry of entries) {
      if (!entry.accountId) continue
      const netChange = entry.debitAmount - entry.creditAmount
      if (netChange === 0) continue
      await tx
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${netChange}`,
        })
        .where(
          and(
            eq(accounts.id, entry.accountId),
            eq(accounts.companyId, companyId)
          )
        )
    }

    return { voucherId: voucher.id, voucherNumber: voucher.voucherNumber }
  })

  revalidatePath(`/${companyId}`)
  return result
}

// ---------------------------------------------------------------------------
// cancelVoucher
// ---------------------------------------------------------------------------

export async function cancelVoucher(companyId: string, voucherId: string) {
  await requireCompanyAccess(companyId)

  await db.transaction(async (tx) => {
    const [voucher] = await tx
      .select()
      .from(vouchers)
      .where(
        and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId))
      )

    if (!voucher) throw new Error("Voucher not found")
    if (voucher.status === "cancelled") throw new Error("Already cancelled")

    // Fetch existing items
    const existingItems = await tx
      .select()
      .from(voucherItems)
      .where(eq(voucherItems.voucherId, voucherId))

    // Reverse account balances
    for (const item of existingItems) {
      if (!item.accountId) continue
      const reversal =
        Number(item.creditAmount) - Number(item.debitAmount)
      if (reversal === 0) continue
      await tx
        .update(accounts)
        .set({
          currentBalance: sql`${accounts.currentBalance} + ${reversal}`,
        })
        .where(
          and(
            eq(accounts.id, item.accountId),
            eq(accounts.companyId, companyId)
          )
        )
    }

    // Reverse stock movements
    const stockItems = existingItems.filter((i) => i.itemId !== null)
    for (const item of stockItems) {
      if (!item.itemId) continue
      const origQty = Number(item.quantity ?? 0)
      const reversal = -origQty // opposite direction
      await tx
        .update(items)
        .set({ currentStock: sql`${items.currentStock} + ${reversal}` })
        .where(
          and(eq(items.id, item.itemId), eq(items.companyId, companyId))
        )
    }

    // Mark cancelled
    await tx
      .update(vouchers)
      .set({ status: "cancelled" })
      .where(eq(vouchers.id, voucherId))
  })

  revalidatePath(`/${companyId}`)
}

// ---------------------------------------------------------------------------
// getVouchersByClass  (server-side data fetcher, call from page.tsx)
// ---------------------------------------------------------------------------

export async function getVouchersByClass(
  companyId: string,
  voucherClasses: string[]
) {
  await requireCompanyAccess(companyId)

  // Fetch voucher type IDs for the requested classes
  const types = await db
    .select({ id: voucherTypes.id, voucherClass: voucherTypes.voucherClass })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        inArray(voucherTypes.voucherClass, voucherClasses)
      )
    )

  if (types.length === 0) return []

  const typeIds = types.map((t) => t.id)

  const rows = await db
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

  return rows
}

// ---------------------------------------------------------------------------
// getVoucherDetail
// ---------------------------------------------------------------------------

export async function getVoucherDetail(companyId: string, voucherId: string) {
  await requireCompanyAccess(companyId)

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
    .where(
      and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId))
    )

  if (!voucher) return null

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
