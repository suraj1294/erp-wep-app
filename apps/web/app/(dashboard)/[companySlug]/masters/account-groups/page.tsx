import { listAccountGroups } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { AccountGroupsClient } from "./account-groups-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function AccountGroupsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { company } = await requireCompanyAccess(companySlug)

  const groups = await listAccountGroups(company.id)

  return (
    <div className="p-6">
      <AccountGroupsClient companySlug={company.slug} initialGroups={groups} />
    </div>
  )
}
