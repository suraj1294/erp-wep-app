import { getVoucherListData } from "@/lib/server-api"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function DebitNotesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { rows, companySlug: resolvedCompanySlug } = await getVoucherListData(
    companySlug,
    "debit_note"
  )

  return (
    <VoucherListTable
      title="Debit Notes"
      rows={rows}
      newHref={`/${resolvedCompanySlug}/debit-notes/new`}
      newLabel="New Debit Note"
      basePath={`/${resolvedCompanySlug}/debit-notes`}
    />
  )
}
