import { eq, and, desc, inArray } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { vouchers, voucherTypes, parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function DebitNotesPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const dnTypes = await db
    .select({ id: voucherTypes.id })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        eq(voucherTypes.voucherClass, "debit_note")
      )
    )

  const typeIds = dnTypes.map((t) => t.id)

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
              eq(vouchers.companyId, companyId),
              inArray(vouchers.voucherTypeId, typeIds)
            )
          )
          .orderBy(desc(vouchers.voucherDate), desc(vouchers.createdAt))

  return (
    <VoucherListTable
      title="Debit Notes"
      rows={rows.map((r) => ({ ...r, partyName: r.partyName ?? null }))}
      newHref={`/${companyId}/debit-notes/new`}
      newLabel="New Debit Note"
      basePath={`/${companyId}/debit-notes`}
    />
  )
}
