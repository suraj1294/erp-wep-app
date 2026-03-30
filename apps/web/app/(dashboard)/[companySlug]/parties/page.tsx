import { asc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { PartiesReportClient } from "./parties-report-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function PartiesReportPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const partiesList = await db
    .select()
    .from(parties)
    .where(eq(parties.companyId, company.id))
    .orderBy(asc(parties.name))

  return (
    <div className="p-6">
      <PartiesReportClient parties={partiesList} />
    </div>
  )
}
