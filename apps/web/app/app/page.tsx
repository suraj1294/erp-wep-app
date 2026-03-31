import { redirect } from "next/navigation"
import { getFirstActiveCompanyForUser } from "@workspace/db"
import { getServerSession } from "@/lib/auth-server"

// Landing page after sign-in — routes the user to their first company
// or to create-company if they have none.
export default async function AppPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const first = await getFirstActiveCompanyForUser(session.user.id)

  if (!first) {
    redirect("/create-company")
  }

  redirect(`/${first.companySlug}`)
}
