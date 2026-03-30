import { eq } from "drizzle-orm"
import { requireCompanyAccess } from "@/lib/company-access"
import { db } from "@workspace/db/client"
import { accountGroups, accounts } from "@workspace/db/schema"

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const groups = await db.query.accountGroups.findMany({
    where: eq(accountGroups.companyId, company.id),
    with: {
      accounts: true,
    },
    orderBy: (group, { asc }) => [asc(group.name)],
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
      </div>
      <div className="mt-6">
        {groups.length === 0 ? (
          <p className="text-muted-foreground">
            No account groups yet. Account groups and default accounts will be
            seeded when the company is created.
          </p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="rounded-lg border">
                <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {group.accountType} &middot; {group.nature}
                    </p>
                  </div>
                  {group.code && (
                    <span className="text-xs text-muted-foreground">
                      {group.code}
                    </span>
                  )}
                </div>
                {group.accounts.length > 0 && (
                  <div className="divide-y">
                    {group.accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between px-4 py-2"
                      >
                        <div>
                          <p className="text-sm">{account.name}</p>
                          {account.code && (
                            <p className="text-xs text-muted-foreground">
                              {account.code}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-medium tabular-nums">
                          {account.currentBalance}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
