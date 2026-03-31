import { redirect } from "next/navigation"
import { listActiveCompaniesForUser } from "@workspace/db"
import { getServerSession } from "@/lib/auth-server"
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

  const userCompanies = await listActiveCompaniesForUser(session.user.id)

  if (userCompanies.length === 0) {
    redirect("/create-company")
  }

  // Ensure the requested company actually belongs to this user
  const currentCompany = userCompanies.find(
    (company) => company.slug === companySlug || company.id === companySlug
  )
  if (!currentCompany) {
    redirect(`/${userCompanies[0]!.slug}`)
  }

  if (currentCompany.slug !== companySlug) {
    redirect(`/${currentCompany.slug}`)
  }

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
