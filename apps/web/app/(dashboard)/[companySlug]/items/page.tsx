import { listItems, listUnitOptions } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemsReportClient } from "./items-report-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function ItemsReportPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [itemsList, unitsList] = await Promise.all([
    listItems(company.id),
    listUnitOptions(company.id),
  ])

  return (
    <div className="p-6">
      <ItemsReportClient items={itemsList} units={unitsList} />
    </div>
  )
}
