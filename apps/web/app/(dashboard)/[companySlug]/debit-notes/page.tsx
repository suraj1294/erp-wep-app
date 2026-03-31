import { listVoucherRowsByClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function DebitNotesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const rows = await listVoucherRowsByClass(company.id, "debit_note")

  return (
    <VoucherListTable
      title="Debit Notes"
      rows={rows}
      newHref={`/${company.slug}/debit-notes/new`}
      newLabel="New Debit Note"
      basePath={`/${company.slug}/debit-notes`}
    />
  )
}
