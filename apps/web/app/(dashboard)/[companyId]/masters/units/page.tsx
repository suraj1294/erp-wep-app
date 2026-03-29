import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { unitsOfMeasure } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { UnitsClient } from "./units-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function UnitsPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const units = await db
    .select()
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, companyId))
    .orderBy(asc(unitsOfMeasure.name))

  return (
    <div className="p-6">
      <UnitsClient companyId={companyId} initialUnits={units} />
    </div>
  )
}
