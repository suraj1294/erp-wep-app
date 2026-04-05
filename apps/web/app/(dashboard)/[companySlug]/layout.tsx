import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { resolveAccessibleCompany } from "@/lib/company-routing"
import { DashboardShell } from "../dashboard-shell"

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const { companySlug } = await params
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const { currentCompany, userCompanies } = await resolveAccessibleCompany(companySlug)

  return (
    <DashboardShell
      user={session.user}
      companies={userCompanies}
      currentCompanySlug={currentCompany.slug}
    >
      {children}
    </DashboardShell>
  )
}
