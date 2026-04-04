import { getVoucherListData } from "@/lib/server-api"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PurchasePage({ params }: PageProps) {
  const { companySlug } = await params
  const { rows, companySlug: resolvedCompanySlug } = await getVoucherListData(
    companySlug,
    "purchase"
  )

  return (
    <VoucherListTable
      title="Purchase Bills"
      rows={rows}
      newHref={`/${resolvedCompanySlug}/purchase/new`}
      newLabel="New Bill"
      basePath={`/${resolvedCompanySlug}/purchase`}
    />
  )
}
