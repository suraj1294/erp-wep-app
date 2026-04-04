import { getMasterResourceData } from "@/lib/server-api"
import { AccountsClient } from "./accounts-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function AccountsPage({ params }: PageProps) {
  const { companySlug } = await params
  const data = await getMasterResourceData(companySlug, "accounts")

  return (
    <div className="p-6">
      <AccountsClient
        companySlug={companySlug}
        initialAccounts={data.accounts}
        accountGroups={data.accountGroups}
      />
    </div>
  )
}
