import {
  getCompanySettingsRecord,
  listCompaniesForSettings,
  getSampleDataSeedProgress,
  type SampleDataSeedProgress,
} from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { CompanySettingsClient } from "./company-settings-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { session, company } = await requireCompanyAccess(companySlug)

  const rows = await listCompaniesForSettings(session.user.id)

  const currentCompanyRow = await getCompanySettingsRecord(company.id)

  const currentCompanySettings =
    currentCompanyRow?.settings &&
    typeof currentCompanyRow.settings === "object"
      ? (currentCompanyRow.settings as Record<string, unknown>)
      : {}
  const initialSampleDataSeedProgress: SampleDataSeedProgress | null =
    getSampleDataSeedProgress(currentCompanyRow?.settings)
  const sampleDataSeeded = currentCompanySettings.sampleDataSeeded === true

  return (
    <CompanySettingsClient
      currentCompanySlug={company.slug}
      companies={rows.map(({ createdAt: _createdAt, ...company }) => company)}
      sampleDataSeeded={sampleDataSeeded}
      initialSampleDataSeedProgress={initialSampleDataSeedProgress}
    />
  )
}
