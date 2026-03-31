import { listUnits } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { UnitsClient } from "./units-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function UnitsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const units = await listUnits(company.id)

  return (
    <div className="p-6">
      <UnitsClient companySlug={company.slug} initialUnits={units} />
    </div>
  )
}
