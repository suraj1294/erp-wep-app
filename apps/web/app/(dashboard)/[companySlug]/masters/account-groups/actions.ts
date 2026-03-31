"use server"

import { createAccountGroup as createAccountGroupRecord, deleteAccountGroup as deleteAccountGroupRecord, updateAccountGroup as updateAccountGroupRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"

interface AccountGroupData {
  name: string
  code?: string
  accountType: string
  nature: string
  parentId?: string | null
}

export async function createAccountGroup(
  companySlug: string,
  data: AccountGroupData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await createAccountGroupRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/account-groups`)
}

export async function updateAccountGroup(
  companySlug: string,
  id: string,
  data: AccountGroupData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateAccountGroupRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/account-groups`)
}

export async function deleteAccountGroup(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteAccountGroupRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/account-groups`)
}
