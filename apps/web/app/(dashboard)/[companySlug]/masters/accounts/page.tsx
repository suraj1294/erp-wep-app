import { listAccountGroupOptions, listAccounts } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountsClient } from "./accounts-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function AccountsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const [accountsList, groupsList] = await Promise.all([
    listAccounts(company.id),
    listAccountGroupOptions(company.id),
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
