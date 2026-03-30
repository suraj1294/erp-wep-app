import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { unitsOfMeasure } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { UnitsClient } from "./units-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function UnitsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const units = await db
    .select()
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, company.id))
    .orderBy(asc(unitsOfMeasure.name))

  return (
    <div className="p-6">
      <UnitsClient companySlug={company.slug} initialUnits={units} />
    </div>
  )
}
