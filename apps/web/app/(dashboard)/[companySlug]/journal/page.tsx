import { getVoucherListData } from "@/lib/server-api"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function JournalPage({ params }: PageProps) {
  const { companySlug } = await params
  const { rows, companySlug: resolvedCompanySlug } = await getVoucherListData(
    companySlug,
    "journal"
  )

  return (
    <VoucherListTable
      title="Journal Entries"
      rows={rows}
      newHref={`/${resolvedCompanySlug}/journal/new`}
      newLabel="New Entry"
      basePath={`/${resolvedCompanySlug}/journal`}
    />
  )
}
