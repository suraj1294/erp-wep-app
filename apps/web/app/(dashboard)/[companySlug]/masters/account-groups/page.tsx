import { getMasterResourceData } from "@/lib/server-api"
import { AccountGroupsClient } from "./account-groups-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function AccountGroupsPage({ params }: PageProps) {
  const { companySlug } = await params
  const groups = await getMasterResourceData(companySlug, "account-groups")

  return (
    <div className="p-6">
      <AccountGroupsClient companySlug={companySlug} initialGroups={groups} />
    </div>
  )
}
