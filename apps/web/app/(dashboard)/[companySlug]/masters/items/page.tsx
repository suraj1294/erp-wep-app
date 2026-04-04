import { getMasterResourceData } from "@/lib/server-api"
import { ItemsClient } from "./items-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function ItemsPage({ params }: PageProps) {
  const { companySlug } = await params
  const data = await getMasterResourceData(companySlug, "items")

  return (
    <div className="p-6">
      <ItemsClient
        companySlug={companySlug}
        initialItems={data.items}
        units={data.units}
      />
    </div>
  )
}
