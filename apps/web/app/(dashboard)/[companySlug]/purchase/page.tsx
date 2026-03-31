import { listVoucherRowsByClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PurchasePage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const rows = await listVoucherRowsByClass(company.id, "purchase")

  return (
    <VoucherListTable
      title="Purchase Bills"
      rows={rows}
      newHref={`/${company.slug}/purchase/new`}
      newLabel="New Bill"
      basePath={`/${company.slug}/purchase`}
    />
  )
}
