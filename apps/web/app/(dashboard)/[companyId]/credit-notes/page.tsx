import { eq, and, desc, inArray } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { vouchers, voucherTypes, parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function CreditNotesPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const cnTypes = await db
    .select({ id: voucherTypes.id })
    .from(voucherTypes)
    .where(
      and(
        eq(voucherTypes.companyId, companyId),
        eq(voucherTypes.voucherClass, "credit_note")
      )
    )

  const typeIds = cnTypes.map((t) => t.id)

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
      title="Credit Notes"
      rows={rows.map((r) => ({ ...r, partyName: r.partyName ?? null }))}
      newHref={`/${companyId}/credit-notes/new`}
      newLabel="New Credit Note"
      basePath={`/${companyId}/credit-notes`}
    />
  )
}
