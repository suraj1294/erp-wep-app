import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { voucherTypes } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherTypesClient } from "./voucher-types-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function VoucherTypesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const voucherTypesList = await db
    .select()
    .from(voucherTypes)
    .where(eq(voucherTypes.companyId, company.id))
    .orderBy(asc(voucherTypes.name))

  return (
    <div className="p-6">
      <VoucherTypesClient
        companySlug={company.slug}
        initialVoucherTypes={voucherTypesList}
      />
    </div>
  )
}
