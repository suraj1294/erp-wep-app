import { listItems, listUnitOptions } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemsClient } from "./items-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function ItemsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [itemsList, unitsList] = await Promise.all([
    listItems(company.id),
    listUnitOptions(company.id),
  ])

  return (
    <div className="p-6">
      <ItemsClient
        companySlug={company.slug}
        initialItems={itemsList}
        units={unitsList}
      />
    </div>
  )
}
