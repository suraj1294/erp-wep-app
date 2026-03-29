import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { PartiesClient } from "./parties-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function PartiesPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const partiesList = await db
    .select()
    .from(parties)
    .where(eq(parties.companyId, companyId))
    .orderBy(asc(parties.name))

  return (
    <div className="p-6">
      <PartiesClient companyId={companyId} initialParties={partiesList} />
    </div>
  )
}
