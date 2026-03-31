import { listVoucherTypes } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherTypesClient } from "./voucher-types-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function VoucherTypesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const voucherTypesList = await listVoucherTypes(company.id)

  return (
    <div className="p-6">
      <VoucherTypesClient
        companySlug={company.slug}
        initialVoucherTypes={voucherTypesList}
      />
    </div>
  )
}
