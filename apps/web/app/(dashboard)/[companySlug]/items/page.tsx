import { asc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { items, unitsOfMeasure } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemsReportClient } from "./items-report-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function ItemsReportPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [itemsList, unitsList] = await Promise.all([
    db
      .select()
      .from(items)
      .where(eq(items.companyId, company.id))
      .orderBy(asc(items.name)),
    db
      .select({
        id: unitsOfMeasure.id,
        name: unitsOfMeasure.name,
        symbol: unitsOfMeasure.symbol,
      })
      .from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.companyId, company.id))
      .orderBy(asc(unitsOfMeasure.name)),
  ])

  return (
    <div className="p-6">
      <ItemsReportClient items={itemsList} units={unitsList} />
    </div>
  )
}
