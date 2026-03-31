import { listParties } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { PartiesClient } from "./parties-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PartiesPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const partiesList = await listParties(company.id)

  return (
    <div className="p-6">
      <PartiesClient companySlug={company.slug} initialParties={partiesList} />
    </div>
  )
}
