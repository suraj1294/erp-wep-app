import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { locations } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { LocationsClient } from "./locations-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function LocationsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const locationsList = await db
    .select()
    .from(locations)
    .where(eq(locations.companyId, company.id))
    .orderBy(asc(locations.name))

  return (
    <div className="p-6">
      <LocationsClient companySlug={company.slug} initialLocations={locationsList} />
    </div>
  )
}
