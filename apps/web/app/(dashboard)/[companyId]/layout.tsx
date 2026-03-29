import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { getServerSession } from "@/lib/auth-server"
import { db } from "@workspace/db/client"
import { companyUsers, companies } from "@workspace/db/schema"
import { DashboardShell } from "../dashboard-shell"

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const userCompanies = await db
    .select({
      id: companies.id,
      name: companies.name,
      displayName: companies.displayName,
      role: companyUsers.role,
    })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, session.user.id),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )

  if (userCompanies.length === 0) {
    redirect("/create-company")
  }

  // Ensure the requested company actually belongs to this user
  const currentCompany = userCompanies.find((c) => c.id === companyId)
  if (!currentCompany) {
    redirect(`/${userCompanies[0]!.id}`)
  }

  return (
    <DashboardShell
      user={session.user}
      companies={userCompanies}
      currentCompanyId={companyId}
    >
      {children}
    </DashboardShell>
  )
}
