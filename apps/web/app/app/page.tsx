import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth-server"
import { getFirstActiveCompany } from "@/lib/server-api"

// Landing page after sign-in — routes the user to their first company
// or to create-company if they have none.
export default async function AppPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/sign-in")
  }

  const first = await getFirstActiveCompany()

  if (!first) {
    redirect("/create-company")
  }

  redirect(`/${first.companySlug}`)
}
