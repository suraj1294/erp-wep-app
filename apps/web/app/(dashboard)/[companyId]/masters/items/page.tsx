import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { items, unitsOfMeasure } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { ItemsClient } from "./items-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function ItemsPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const [itemsList, unitsList] = await Promise.all([
    db
      .select()
      .from(items)
      .where(eq(items.companyId, companyId))
      .orderBy(asc(items.name)),
    db
      .select({
        id: unitsOfMeasure.id,
        name: unitsOfMeasure.name,
        symbol: unitsOfMeasure.symbol,
      })
      .from(unitsOfMeasure)
      .where(eq(unitsOfMeasure.companyId, companyId))
      .orderBy(asc(unitsOfMeasure.name)),
  ])

  return (
    <div className="p-6">
      <ItemsClient
        companyId={companyId}
        initialItems={itemsList}
        units={unitsList}
      />
    </div>
  )
}
