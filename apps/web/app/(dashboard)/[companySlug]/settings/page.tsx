import { getCompanySettingsData } from "@/lib/server-api"
import { CompanySettingsClient } from "./company-settings-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { companySlug } = await params
  const settingsData = await getCompanySettingsData(companySlug)

  return (
    <CompanySettingsClient
      currentCompanySlug={settingsData.currentCompanySlug}
      companies={settingsData.companies}
      sampleDataSeeded={settingsData.sampleDataSeeded}
      initialSampleDataSeedProgress={settingsData.initialSampleDataSeedProgress}
    />
  )
}
