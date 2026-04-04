import type {
  AccountOptionPayload,
  ItemOptionPayload,
  VoucherDetail,
} from "@/lib/server-api"

export interface ItemVoucherInitialValues {
  voucherNumber: string
  voucherTypeId: string
  voucherDate: string
  referenceNumber: string
  partyId: string
  dueDate: string
  narration: string
  lines: Array<{
    itemId: string
    itemName: string
    description: string
    quantity: string
    rate: string
    taxRate: string
    unitSymbol: string
  }>
}

export interface AccountVoucherInitialValues {
  voucherNumber: string
  voucherTypeId: string
  voucherDate: string
  referenceNumber: string
  partyId: string
  balancingAccountId: string
  narration: string
  lines: Array<{
    accountId: string
    accountName: string
    description: string
    amount: string
    debitAmount: string
    creditAmount: string
  }>
}

const TRANSACTION_META: Record<
  string,
  { listPath: string; editTitle: string }
> = {
  sales: { listPath: "sales", editTitle: "Edit Sales Invoice" },
  purchase: { listPath: "purchase", editTitle: "Edit Purchase Bill" },
  payment: { listPath: "banking", editTitle: "Edit Payment" },
  receipt: { listPath: "banking", editTitle: "Edit Receipt" },
  contra: { listPath: "banking", editTitle: "Edit Contra Entry" },
  journal: { listPath: "journal", editTitle: "Edit Journal Entry" },
  credit_note: { listPath: "credit-notes", editTitle: "Edit Credit Note" },
  debit_note: { listPath: "debit-notes", editTitle: "Edit Debit Note" },
}

export function getVoucherMeta(voucherClass: string) {
  return TRANSACTION_META[voucherClass] ?? { listPath: "", editTitle: "Edit Voucher" }
}

export function buildItemVoucherInitialValues(
  voucher: VoucherDetail,
  items: ItemOptionPayload[]
): ItemVoucherInitialValues {
  const itemById = new Map(items.map((item) => [item.id, item]))
  const itemLines = voucher.lineItems.filter((line) => line.itemId)

  return {
    voucherNumber: voucher.voucherNumber,
    voucherTypeId: voucher.voucherTypeId,
    voucherDate: voucher.voucherDate,
    referenceNumber: voucher.referenceNumber ?? "",
    partyId: voucher.partyId ?? "",
    dueDate: voucher.dueDate ?? "",
    narration: voucher.narration ?? "",
    lines: itemLines.map((line) => {
      const item = line.itemId ? itemById.get(line.itemId) : null

      return {
        itemId: line.itemId ?? "",
        itemName: line.itemName ?? item?.name ?? "",
        description: line.description ?? "",
        quantity: line.quantity ?? "1",
        rate: line.rate ?? "",
        taxRate: item?.taxRate ?? "0",
        unitSymbol: item?.unitSymbol ?? "",
      }
    }),
  }
}

function isCashBankLine(
  line: VoucherDetail["lineItems"][number],
  cashBankAccountIds: Set<string>
) {
  return Boolean(line.accountId && cashBankAccountIds.has(line.accountId))
}

function getLineAmount(line: VoucherDetail["lineItems"][number]) {
  return String(
    Math.max(
      Number(line.debitAmount ?? 0),
      Number(line.creditAmount ?? 0)
    )
  )
}

export function buildAccountVoucherInitialValues(
  voucher: VoucherDetail,
  cashBankAccounts: AccountOptionPayload[]
): AccountVoucherInitialValues {
  const accountLines = voucher.lineItems.filter((line) => line.accountId)
  const cashBankAccountIds = new Set(cashBankAccounts.map((account) => account.id))
  let balancingLineIndex = -1

  if (voucher.voucherClass === "payment") {
    balancingLineIndex = accountLines.findIndex(
      (line) =>
        isCashBankLine(line, cashBankAccountIds) &&
        Number(line.creditAmount ?? 0) > 0
    )

    if (balancingLineIndex === -1) {
      balancingLineIndex = accountLines.findIndex(
        (line) => Number(line.creditAmount ?? 0) > 0
      )
    }
  } else if (voucher.voucherClass === "receipt") {
    balancingLineIndex = accountLines.findIndex(
      (line) =>
        isCashBankLine(line, cashBankAccountIds) &&
        Number(line.debitAmount ?? 0) > 0
    )

    if (balancingLineIndex === -1) {
      balancingLineIndex = accountLines.findIndex((line) =>
        isCashBankLine(line, cashBankAccountIds)
      )
    }
  }

  const balancingLine =
    balancingLineIndex >= 0 ? accountLines[balancingLineIndex] : undefined
  const editableLines =
    balancingLineIndex >= 0
      ? accountLines.filter((_, index) => index !== balancingLineIndex)
      : accountLines

  return {
    voucherNumber: voucher.voucherNumber,
    voucherTypeId: voucher.voucherTypeId,
    voucherDate: voucher.voucherDate,
    referenceNumber: voucher.referenceNumber ?? "",
    partyId: voucher.partyId ?? "",
    balancingAccountId: balancingLine?.accountId ?? "",
    narration: voucher.narration ?? "",
    lines: editableLines.map((line) => ({
      accountId: line.accountId ?? "",
      accountName: line.accountName ?? "",
      description: line.description ?? "",
      amount: getLineAmount(line),
      debitAmount: line.debitAmount ?? "",
      creditAmount: line.creditAmount ?? "",
    })),
  }
}
