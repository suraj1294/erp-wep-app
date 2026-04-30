import {
  createCompanyMasterRecord,
  deleteCompanyMasterRecord,
  getCompanyMasterPagePath,
  isCompanyMasterResource,
  updateCompanyMasterRecord,
  type CompanyMasterResource,
} from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"

export { isCompanyMasterResource } from "@workspace/db"

export async function createCompanyMasterResource(
  companySlug: string,
  resource: CompanyMasterResource,
  data: unknown
) {
  const { company } = await requireCompanyAccess(companySlug)

  await createCompanyMasterRecord(company.id, resource, data)
  revalidatePath(`/${company.slug}/masters/${getCompanyMasterPagePath(resource)}`)
}

export async function updateCompanyMasterResource(
  companySlug: string,
  resource: CompanyMasterResource,
  id: string,
  data: unknown
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateCompanyMasterRecord(company.id, resource, id, data)
  revalidatePath(`/${company.slug}/masters/${getCompanyMasterPagePath(resource)}`)
}

export async function deleteCompanyMasterResource(
  companySlug: string,
  resource: CompanyMasterResource,
  id: string
) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteCompanyMasterRecord(company.id, resource, id)
  revalidatePath(`/${company.slug}/masters/${getCompanyMasterPagePath(resource)}`)
}
