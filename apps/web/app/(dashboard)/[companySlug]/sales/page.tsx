import { eq, and, desc, inArray } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { vouchers, voucherTypes, parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function SalesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const salesTypes = await db
    .select({ id: voucherTypes.id })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, company.id),
        eq(voucherTypes.voucherClass, "sales")
      )
    )

  const typeIds = salesTypes.map((t) => t.id)

  const rows =
    typeIds.length === 0
      ? []
      : await db
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
              eq(vouchers.companyId, company.id),
              inArray(vouchers.voucherTypeId, typeIds)
            )
          )
          .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))

  return (
    <VoucherListTable
      title="Sales Invoices"
      rows={rows.map((r) => ({ ...r, partyName: r.partyName ?? null }))}
      newHref={`/${company.slug}/sales/new`}
      newLabel="New Invoice"
      basePath={`/${company.slug}/sales`}
    />
  )
}
