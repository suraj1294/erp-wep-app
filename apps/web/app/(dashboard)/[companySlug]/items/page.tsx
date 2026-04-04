import { getMasterResourceData } from "@/lib/server-api"
import { ItemsReportClient } from "./items-report-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function ItemsReportPage({ params }: PageProps) {
  const { companySlug } = await params
  const data = await getMasterResourceData(companySlug, "items")

  return (
    <div className="p-6">
      <ItemsReportClient items={data.items} units={data.units} />
    </div>
  )
}
