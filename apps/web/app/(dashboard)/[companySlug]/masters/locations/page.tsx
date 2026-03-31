import { listLocations } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { LocationsClient } from "./locations-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function LocationsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const locationsList = await listLocations(company.id)

  return (
    <div className="p-6">
      <LocationsClient companySlug={company.slug} initialLocations={locationsList} />
    </div>
  )
}
