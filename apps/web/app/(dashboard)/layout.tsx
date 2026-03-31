import { redirect } from "next/navigation"
import { getFirstActiveCompanyForUser } from "@workspace/db"
import { getServerSession } from "@/lib/auth-server"

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
  const membership = await getFirstActiveCompanyForUser(session.user.id)

  if (!membership) {
    redirect("/create-company")
  }

  return <>{children}</>
}
