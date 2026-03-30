import { eq, and, desc, inArray } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { vouchers, voucherTypes, parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { BankingListClient } from "./banking-list-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

async function fetchVouchersForClass(
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

  const typeIds = types.map((t) => t.id)
  if (typeIds.length === 0) return []

  const typeNameMap: Record<string, string> = {}
  for (const t of types) typeNameMap[t.id] = t.name

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

  return rows.map((r) => ({
    ...r,
    partyName: r.partyName ?? null,
    voucherTypeName: typeNameMap[r.voucherTypeId] ?? voucherClass,
  }))
}

export default async function BankingPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [payments, receipts, contras] = await Promise.all([
    fetchVouchersForClass(company.id, "payment"),
    fetchVouchersForClass(company.id, "receipt"),
    fetchVouchersForClass(company.id, "contra"),
  ])

  return (
    <BankingListClient
      companySlug={company.slug}
      payments={payments}
      receipts={receipts}
      contras={contras}
    />
  )
}
