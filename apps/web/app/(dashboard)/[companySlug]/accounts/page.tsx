import { listAccountGroups, listAccounts } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { ChartOfAccountsClient } from "./chart-of-accounts-client"

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [groups, accountsList] = await Promise.all([
    listAccountGroups(company.id),
    listAccounts(company.id),
  ])

  return (
    <div className="p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Chart of Accounts
          </h1>
          <p className="text-muted-foreground">
            Review group structure, balances, and account hierarchy.
          </p>
        </div>
        {groups.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No account groups yet. Account groups and default accounts will be
            seeded when the company is created.
          </div>
        ) : (
          <ChartOfAccountsClient groups={groups} accounts={accountsList} />
        )}
      </div>
    </div>
  )
}
