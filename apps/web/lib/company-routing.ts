import { redirect } from "next/navigation"
import { getAccessibleCompanies } from "@/lib/server-api"

export async function resolveAccessibleCompany(companySlug: string) {
  const userCompanies = await getAccessibleCompanies()

  if (userCompanies.length === 0) {
    redirect("/create-company")
  }

  const currentCompany = userCompanies.find(
    (company) => company.slug === companySlug || company.id === companySlug
  )

  if (!currentCompany) {
    redirect(`/${userCompanies[0]!.slug}`)
  }

  if (currentCompany.slug !== companySlug) {
    redirect(`/${currentCompany.slug}`)
  }

  return {
    currentCompany,
    userCompanies,
  }
}
