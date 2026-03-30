import { eq, asc } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { accounts, accountGroups } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountsClient } from "./accounts-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function AccountsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [accountsList, groupsList] = await Promise.all([
    db
      .select()
      .from(accounts)
      .where(eq(accounts.companyId, company.id))
      .orderBy(asc(accounts.name)),
    db
      .select({ id: accountGroups.id, name: accountGroups.name })
      .from(accountGroups)
      .where(eq(accountGroups.companyId, company.id))
      .orderBy(asc(accountGroups.name)),
  ])

  return (
    <div className="p-6">
      <AccountsClient
        companySlug={company.slug}
        initialAccounts={accountsList}
        accountGroups={groupsList}
      />
    </div>
  )
}
