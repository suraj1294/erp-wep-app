import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { getFirstActiveCompany } from "@/lib/server-api"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  // If the user has no companies, send them to create one.
  // This only applies at the (dashboard) group level — the [companySlug] nested
  // layout handles its own sidebar data fetching.
  const membership = await getFirstActiveCompany()

  if (!membership) {
    redirect("/create-company")
  }

  return <>{children}</>
}
