import { getMasterResourceData } from "@/lib/server-api"
import { PartiesClient } from "./parties-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PartiesPage({ params }: PageProps) {
  const { companySlug } = await params
  const partiesList = await getMasterResourceData(companySlug, "parties")

  return (
    <div className="p-6">
      <PartiesClient companySlug={companySlug} initialParties={partiesList} />
    </div>
  )
}
