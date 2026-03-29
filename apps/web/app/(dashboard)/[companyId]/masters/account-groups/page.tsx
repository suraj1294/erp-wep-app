import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { accountGroups } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountGroupsClient } from "./account-groups-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function AccountGroupsPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const groups = await db
    .select()
    .from(accountGroups)
    .where(eq(accountGroups.companyId, companyId))
    .orderBy(asc(accountGroups.level), asc(accountGroups.name))

  return (
    <div className="p-6">
      <AccountGroupsClient companyId={companyId} initialGroups={groups} />
    </div>
  )
}
