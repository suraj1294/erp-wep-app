import { getMasterResourceData } from "@/lib/server-api"
import { LocationsClient } from "./locations-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function LocationsPage({ params }: PageProps) {
  const { companySlug } = await params
  const locationsList = await getMasterResourceData(companySlug, "locations")

  return (
    <div className="p-6">
      <LocationsClient
        companySlug={companySlug}
        initialLocations={locationsList}
      />
    </div>
  )
}
