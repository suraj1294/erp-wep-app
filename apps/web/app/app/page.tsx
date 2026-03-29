import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"
import { getServerSession } from "@/lib/auth-server"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"

// Landing page after sign-in — routes the user to their first company
// or to create-company if they have none.
export default async function AppPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const [first] = await db
    .select({ companyId: companyUsers.companyId })
    .from(companyUsers)
    .innerJoin(companies, eq(companyUsers.companyId, companies.id))
    .where(
      and(
        eq(companyUsers.userId, session.user.id),
        eq(companyUsers.isActive, true),
        eq(companies.isActive, true)
      )
    )
    .limit(1)

  if (!first) {
    redirect("/create-company")
  }

  redirect(`/${first.companyId}`)
}
