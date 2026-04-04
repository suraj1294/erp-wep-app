import { getMasterResourceData } from "@/lib/server-api"
import { VoucherTypesClient } from "./voucher-types-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function VoucherTypesPage({ params }: PageProps) {
  const { companySlug } = await params
  const voucherTypesList = await getMasterResourceData(
    companySlug,
    "voucher-types"
  )

  return (
    <div className="p-6">
      <VoucherTypesClient
        companySlug={companySlug}
        initialVoucherTypes={voucherTypesList}
      />
    </div>
  )
}
