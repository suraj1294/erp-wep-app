import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { voucherTypes } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { VoucherTypesClient } from "./voucher-types-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function VoucherTypesPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const voucherTypesList = await db
    .select()
    .from(voucherTypes)
    .where(eq(voucherTypes.companyId, companyId))
    .orderBy(asc(voucherTypes.name))

  return (
    <div className="p-6">
      <VoucherTypesClient
        companyId={companyId}
        initialVoucherTypes={voucherTypesList}
      />
    </div>
  )
}
