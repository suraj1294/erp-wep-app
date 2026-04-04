import { getVoucherListData } from "@/lib/server-api"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function CreditNotesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { rows, companySlug: resolvedCompanySlug } = await getVoucherListData(
    companySlug,
    "credit_note"
  )

  return (
    <VoucherListTable
      title="Credit Notes"
      rows={rows}
      newHref={`/${resolvedCompanySlug}/credit-notes/new`}
      newLabel="New Credit Note"
      basePath={`/${resolvedCompanySlug}/credit-notes`}
    />
  )
}
