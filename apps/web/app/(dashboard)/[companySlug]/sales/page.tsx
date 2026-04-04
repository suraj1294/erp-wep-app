import { getVoucherListData } from "@/lib/server-api"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function SalesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { rows, companySlug: resolvedCompanySlug } = await getVoucherListData(
    companySlug,
    "sales"
  )

  return (
    <VoucherListTable
      title="Sales Invoices"
      rows={rows}
      newHref={`/${resolvedCompanySlug}/sales/new`}
      newLabel="New Invoice"
      basePath={`/${resolvedCompanySlug}/sales`}
    />
  )
}
