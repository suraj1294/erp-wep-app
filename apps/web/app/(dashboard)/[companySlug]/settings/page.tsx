import { and, desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import {
  getSampleDataSeedProgress,
  type SampleDataSeedProgress,
} from "@workspace/db"
import { companies, companyUsers } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { CompanySettingsClient } from "./company-settings-client"

interface PageProps {
  params: Promise<{ companySlug: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { companySlug } = await params
  const { session, company } = await requireCompanyAccess(companySlug)

  const rows = await db
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      displayName: companies.displayName,
      email: companies.email,
      phone: companies.phone,
      gstin: companies.gstin,
      pan: companies.pan,
      isActive: companies.isActive,
      role: companyUsers.role,
      createdAt: companies.createdAt,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(eq(companyUsers.userId, session.user.id))
    .orderBy(desc(companies.isActive), desc(companies.createdAt))

  const [currentCompanyRow] = await db
    .select({ settings: companies.settings })
    .from(companies)
    .where(eq(companies.id, company.id))
    .limit(1)

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
