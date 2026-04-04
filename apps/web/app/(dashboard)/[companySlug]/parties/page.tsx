import { getMasterResourceData } from "@/lib/server-api"
import { PartiesReportClient } from "./parties-report-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PartiesReportPage({ params }: PageProps) {
  const { companySlug } = await params
  const partiesList = await getMasterResourceData(companySlug, "parties")

  return (
    <div className="p-6">
      <PartiesReportClient parties={partiesList} />
    </div>
  )
}
