import { listVoucherRowsByClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherListTable } from "@/components/vouchers/voucher-list-table"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function CreditNotesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const rows = await listVoucherRowsByClass(company.id, "credit_note")

  return (
    <VoucherListTable
      title="Credit Notes"
      rows={rows}
      newHref={`/${company.slug}/credit-notes/new`}
      newLabel="New Credit Note"
      basePath={`/${company.slug}/credit-notes`}
    />
  )
}
