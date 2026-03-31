import { listParties } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { PartiesReportClient } from "./parties-report-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PartiesReportPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const partiesList = await listParties(company.id)

  return (
    <div className="p-6">
      <PartiesReportClient parties={partiesList} />
    </div>
  )
}
