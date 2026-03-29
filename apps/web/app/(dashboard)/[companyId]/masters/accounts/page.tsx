import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { accounts, accountGroups } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountsClient } from "./accounts-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function AccountsPage({ params }: PageProps) {
  const { companyId } = await params
  await requireCompanyAccess(companyId)

  const [accountsList, groupsList] = await Promise.all([
    db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, companyId))
      .orderBy(asc(accounts.name)),
    db
      .select({ id: accountGroups.id, name: accountGroups.name })
      .from(accountGroups)
      .where(eq(accountGroups.companyId, companyId))
      .orderBy(asc(accountGroups.name)),
  ])

  return (
    <div className="p-6">
      <AccountsClient
        companyId={companyId}
        initialAccounts={accountsList}
        accountGroups={groupsList}
      />
    </div>
  )
}
