"use server"

import { createAccount as createAccountRecord, deleteAccount as deleteAccountRecord, updateAccount as updateAccountRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"

interface AccountData {
  name: string
  code?: string
  description?: string
  groupId?: string | null
  openingBalance?: string
}

export async function createAccount(companySlug: string, data: AccountData) {
  const { company } = await requireCompanyAccess(companySlug)

  await createAccountRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/accounts`)
}

export async function updateAccount(
  companySlug: string,
  id: string,
  data: AccountData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateAccountRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/accounts`)
}

export async function deleteAccount(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteAccountRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/accounts`)
}
