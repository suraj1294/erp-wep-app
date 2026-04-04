import "server-only"

import { and, desc, eq, gte, sql } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { accountGroups, accounts } from "@workspace/db/schema/accounting"
import { items } from "@workspace/db/schema/inventory"
import { parties } from "@workspace/db/schema/party"
import { vouchers, voucherTypes } from "@workspace/db/schema/voucher"

const VOUCHER_CLASS_META: Record<
  string,
  { label: string; basePath: string }
> = {
  sales: { label: "Sales", basePath: "sales" },
  purchase: { label: "Purchase", basePath: "purchase" },
  payment: { label: "Payments", basePath: "banking" },
  receipt: { label: "Receipts", basePath: "banking" },
  contra: { label: "Contra", basePath: "banking" },
  journal: { label: "Journal", basePath: "journal" },
  credit_note: { label: "Credit Notes", basePath: "credit-notes" },
  debit_note: { label: "Debit Notes", basePath: "debit-notes" },
}

export interface DashboardSummary {
  accountsCount: number
  vouchersCount: number
  partiesCount: number
  itemsCount: number
  lowStockItemsCount: number
  salesThisMonth: string
  purchasesThisMonth: string
  cashBankBalance: string
}

export interface DashboardRecentTransaction {
  id: string
  voucherNumber: string
  voucherDate: string
  voucherTypeName: string | null
  voucherClass: string
  voucherClassLabel: string
  partyName: string | null
  totalAmount: string
  status: string
  href: string
}

export interface DashboardVoucherMixItem {
  voucherClass: string
  label: string
  count: number
  totalAmount: string
}

export interface DashboardMonthlyActivityItem {
  monthKey: string
  monthLabel: string
  count: number
  totalAmount: string
}

export interface CompanyDashboardData {
  summary: DashboardSummary
  recentTransactions: DashboardRecentTransaction[]
  voucherMix: DashboardVoucherMixItem[]
  monthlyActivity: DashboardMonthlyActivityItem[]
}

function getClassMeta(voucherClass: string | null) {
  if (!voucherClass) {
    return { label: "Voucher", basePath: "" }
  }

  return (
    VOUCHER_CLASS_META[voucherClass] ?? {
      label: voucherClass.replace(/_/g, " "),
      basePath: "",
    }
  )
}

function getMonthStart(monthsAgo: number) {
  const now = new Date()
  const value = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  value.setUTCMonth(value.getUTCMonth() - monthsAgo)
  return value
}

function getDateString(value: Date) {
  return value.toISOString().slice(0, 10)
}

function getMonthKey(value: Date) {
  return value.toISOString().slice(0, 7)
}

function getMonthLabel(monthKey: string) {
  const [yearPart = "1970", monthPart = "1"] = monthKey.split("-")
  const year = Number(yearPart)
  const month = Number(monthPart)
  const value = new Date(Date.UTC(year, (month ?? 1) - 1, 1))

  return value.toLocaleString("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
}

function toNumber(value: unknown) {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

function toAmountString(value: number) {
  return value.toFixed(2)
}

export async function getCompanyDashboardSnapshot(
  companyId: string,
  companySlug: string
): Promise<CompanyDashboardData> {
  const currentMonthKey = getMonthKey(getMonthStart(0))
  const activityStartDate = getDateString(getMonthStart(5))
  const monthlyKeys = Array.from({ length: 6 }, (_, index) =>
    getMonthKey(getMonthStart(5 - index))
  )

  const [
    accountCountRows,
    voucherCountRows,
    partyCountRows,
    itemCountRows,
    lowStockRows,
    cashBankRows,
    recentVoucherRows,
    voucherMixRows,
    activityRows,
  ] = await Promise.all([
    db
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(accounts)
      .where(and(eq(accounts.companyId, companyId), eq(accounts.isActive, true))),
    db
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(vouchers)
      .where(eq(vouchers.companyId, companyId)),
    db
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(parties)
      .where(and(eq(parties.companyId, companyId), eq(parties.isActive, true))),
    db
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(items)
      .where(and(eq(items.companyId, companyId), eq(items.isActive, true))),
    db
      .select({ value: sql<number>`cast(count(*) as int)` })
      .from(items)
      .where(
        and(
          eq(items.companyId, companyId),
          eq(items.isActive, true),
          sql`${items.reorderLevel} is not null`,
          sql`cast(${items.reorderLevel} as numeric) > 0`,
          sql`cast(${items.currentStock} as numeric) <= cast(${items.reorderLevel} as numeric)`
        )
      ),
    db
      .select({
        value: sql<string>`coalesce(sum(cast(${accounts.currentBalance} as numeric)), 0)::text`,
      })
      .from(accounts)
      .innerJoin(accountGroups, eq(accounts.groupId, accountGroups.id))
      .where(
        and(
          eq(accounts.companyId, companyId),
          eq(accounts.isActive, true),
          sql`${accountGroups.code} in ('CASH-GRP', 'BANK-GRP')`
        )
      ),
    db
      .select({
        id: vouchers.id,
        voucherNumber: vouchers.voucherNumber,
        voucherDate: vouchers.voucherDate,
        voucherTypeName: voucherTypes.name,
        voucherClass: voucherTypes.voucherClass,
        partyName: parties.name,
        totalAmount: vouchers.totalAmount,
        status: vouchers.status,
      })
      .from(vouchers)
      .innerJoin(voucherTypes, eq(vouchers.voucherTypeId, voucherTypes.id))
      .leftJoin(parties, eq(vouchers.partyId, parties.id))
      .where(eq(vouchers.companyId, companyId))
      .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))
      .limit(8),
    db
      .select({
        voucherClass: voucherTypes.voucherClass,
        count: sql<number>`cast(count(*) as int)`,
        totalAmount: sql<string>`coalesce(sum(cast(${vouchers.totalAmount} as numeric)), 0)::text`,
      })
      .from(vouchers)
      .innerJoin(voucherTypes, eq(vouchers.voucherTypeId, voucherTypes.id))
      .where(eq(vouchers.companyId, companyId))
      .groupBy(voucherTypes.voucherClass),
    db
      .select({
        voucherDate: vouchers.voucherDate,
        totalAmount: vouchers.totalAmount,
        voucherClass: voucherTypes.voucherClass,
      })
      .from(vouchers)
      .innerJoin(voucherTypes, eq(vouchers.voucherTypeId, voucherTypes.id))
      .where(
        and(
          eq(vouchers.companyId, companyId),
          gte(vouchers.voucherDate, activityStartDate)
        )
      )
      .orderBy(desc(vouchers.voucherDate)),
  ])

  const monthlyActivityMap = new Map(
    monthlyKeys.map((monthKey) => [
      monthKey,
      {
        monthKey,
        monthLabel: getMonthLabel(monthKey),
        count: 0,
        totalAmount: 0,
        sales: 0,
        purchases: 0,
      },
    ])
  )

  for (const row of activityRows) {
    const monthKey = String(row.voucherDate).slice(0, 7)
    const bucket = monthlyActivityMap.get(monthKey)

    if (!bucket) {
      continue
    }

    const totalAmount = toNumber(row.totalAmount)
    bucket.count += 1
    bucket.totalAmount += totalAmount

    if (row.voucherClass === "sales") {
      bucket.sales += totalAmount
    }

    if (row.voucherClass === "purchase") {
      bucket.purchases += totalAmount
    }
  }

  const currentMonth = monthlyActivityMap.get(currentMonthKey)

  return {
    summary: {
      accountsCount: toNumber(accountCountRows[0]?.value),
      vouchersCount: toNumber(voucherCountRows[0]?.value),
      partiesCount: toNumber(partyCountRows[0]?.value),
      itemsCount: toNumber(itemCountRows[0]?.value),
      lowStockItemsCount: toNumber(lowStockRows[0]?.value),
      salesThisMonth: toAmountString(currentMonth?.sales ?? 0),
      purchasesThisMonth: toAmountString(currentMonth?.purchases ?? 0),
      cashBankBalance: String(cashBankRows[0]?.value ?? "0"),
    },
    recentTransactions: recentVoucherRows.map((row) => {
      const classMeta = getClassMeta(row.voucherClass)
      const href = classMeta.basePath
        ? `/${companySlug}/${classMeta.basePath}/${row.id}`
        : `/${companySlug}`

      return {
        id: row.id,
        voucherNumber: row.voucherNumber,
        voucherDate: String(row.voucherDate),
        voucherTypeName: row.voucherTypeName ?? null,
        voucherClass: row.voucherClass,
        voucherClassLabel: classMeta.label,
        partyName: row.partyName ?? null,
        totalAmount: String(row.totalAmount),
        status: row.status ?? "active",
        href,
      }
    }),
    voucherMix: voucherMixRows
      .map((row) => ({
        voucherClass: row.voucherClass,
        label: getClassMeta(row.voucherClass).label,
        count: toNumber(row.count),
        totalAmount: String(row.totalAmount),
      }))
      .sort((left, right) => right.count - left.count),
    monthlyActivity: monthlyKeys.map((monthKey) => {
      const bucket = monthlyActivityMap.get(monthKey)

      return {
        monthKey,
        monthLabel: getMonthLabel(monthKey),
        count: bucket?.count ?? 0,
        totalAmount: toAmountString(bucket?.totalAmount ?? 0),
      }
    }),
  }
}
