import { listVoucherRowsByClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function SalesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const rows = await listVoucherRowsByClass(company.id, "sales")

  return (
    <VoucherListTable
      title="Sales Invoices"
      rows={rows}
      newHref={`/${company.slug}/sales/new`}
      newLabel="New Invoice"
      basePath={`/${company.slug}/sales`}
    />
  )
}
