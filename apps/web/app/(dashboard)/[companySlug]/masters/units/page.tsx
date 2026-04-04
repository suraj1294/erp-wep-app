import { getMasterResourceData } from "@/lib/server-api"
import { UnitsClient } from "./units-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function UnitsPage({ params }: PageProps) {
  const { companySlug } = await params
  const units = await getMasterResourceData(companySlug, "units")

  return (
    <div className="p-6">
      <UnitsClient companySlug={companySlug} initialUnits={units} />
    </div>
  )
}
