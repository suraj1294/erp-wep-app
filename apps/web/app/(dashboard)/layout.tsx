import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
import { getServerSession } from "@/lib/auth-server"
import { db } from "@workspace/db/client"
import { companyUsers } from "@workspace/db/schema"

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
  // This only applies at the (dashboard) group level — the [companyId] nested
  // layout handles its own sidebar data fetching.
  const membership = await db
    .select({ companyId: companyUsers.companyId })
    .from(companyUsers)
    .where(eq(companyUsers.userId, session.user.id))
    .limit(1)

  if (membership.length === 0) {
    redirect("/create-company")
  }

  return <>{children}</>
}
