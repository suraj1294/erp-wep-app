import { and, desc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"
import { CompanySettingsClient } from "./company-settings-client"

interface PageProps {
  params: Promise<{ companyId: string }>
}

export default async function SettingsPage({ params }: PageProps) {
  const { companyId } = await params
  const { session } = await requireCompanyAccess(companyId)

  const rows = await db
    .select({
      id: companies.id,
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

  return (
    <CompanySettingsClient
      currentCompanyId={companyId}
      companies={rows.map(({ createdAt: _createdAt, ...company }) => company)}
    />
  )
}
