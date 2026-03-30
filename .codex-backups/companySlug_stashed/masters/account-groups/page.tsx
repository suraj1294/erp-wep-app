import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { accountGroups } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountGroupsClient } from "./account-groups-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function AccountGroupsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const groups = await db
    .select()
    .from(accountGroups)
    .where(eq(accountGroups.companyId, company.id))
    .orderBy(asc(accountGroups.level), asc(accountGroups.name))

  return (
    <div className="p-6">
      <AccountGroupsClient companySlug={company.slug} initialGroups={groups} />
    </div>
  )
}
