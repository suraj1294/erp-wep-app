import { eq, and, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import {
  voucherTypes,
  parties,
  items,
  accounts,
  accountGroups,
  unitsOfMeasure,
} from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemVoucherForm } from "@/components/vouchers/item-voucher-form"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function NewSalesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [salesTypes, customerParties, activeItems, allAccounts] =
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
            eq(voucherTypes.companyId, company.id),
            eq(voucherTypes.voucherClass, "sales"),
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
        .where(
          and(
            eq(parties.companyId, company.id),
            eq(parties.isActive, true)
          )
        )
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
        .where(
          and(eq(items.companyId, company.id), eq(items.isActive, true))
        )
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
        .where(
          and(eq(accounts.companyId, company.id), eq(accounts.isActive, true))
        )
        .orderBy(asc(accounts.name)),
    ])

  // Resolve unit symbols for items
  const unitIds = [...new Set(activeItems.map((i) => i.unitId).filter(Boolean))]
  const unitMap: Record<string, string> = {}
  if (unitIds.length > 0) {
    const units = await db
      .select({ id: unitsOfMeasure.id, symbol: unitsOfMeasure.symbol })
      .from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.companyId, company.id))
    for (const u of units) {
      if (u.symbol) unitMap[u.id] = u.symbol
    }
  }

  const itemOptions = activeItems.map((item) => ({
    id: item.id,
    name: item.name,
    code: item.code,
    salesRate: item.salesRate,
    purchaseRate: item.purchaseRate,
    taxRate: item.taxRate,
    unitSymbol: item.unitId ? (unitMap[item.unitId] ?? null) : null,
  }))

  // Filter parties to customers only (type = "customer" or "both")
  const partyOptions = customerParties.filter(
    (p) => p.type === "customer" || p.type === "both"
  )

  return (
    <ItemVoucherForm
      companyId={company.id}
      voucherClass="sales"
      voucherTypes={salesTypes.map((vt) => ({
        ...vt,
        currentNumber: vt.currentNumber ?? 1,
      }))}
      parties={partyOptions}
      items={itemOptions}
      accounts={allAccounts}
      backHref={`/${company.slug}/sales`}
      title="New Sales Invoice"
      listHref={`/${company.slug}/sales`}
    />
  )
}
