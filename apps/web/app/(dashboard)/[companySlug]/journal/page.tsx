import { listVoucherRowsByClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function JournalPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const rows = await listVoucherRowsByClass(company.id, "journal")

  return (
    <VoucherListTable
      title="Journal Entries"
      rows={rows}
      newHref={`/${company.slug}/journal/new`}
      newLabel="New Entry"
      basePath={`/${company.slug}/journal`}
    />
  )
}
