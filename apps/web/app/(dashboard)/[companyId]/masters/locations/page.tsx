import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { locations } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { LocationsClient } from "./locations-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function LocationsPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const locationsList = await db
    .select()
    .from(locations)
    .where(eq(locations.companyId, companyId))
    .orderBy(asc(locations.name))

  return (
    <div className="p-6">
      <LocationsClient companyId={companyId} initialLocations={locationsList} />
    </div>
  )
}
