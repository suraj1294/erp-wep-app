"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { accountGroups } from "@workspace/db/schema"
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

  await db.insert(accountGroups).values({
    companyId: company.id,
    name: data.name,
    code: data.code ?? null,
    accountType: data.accountType,
    nature: data.nature,
    parentId: data.parentId ?? null,
  })

  revalidatePath(`/${company.slug}/masters/account-groups`)
}

export async function updateAccountGroup(
  companySlug: string,
  id: string,
  data: AccountGroupData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .update(accountGroups)
    .set({
      name: data.name,
      code: data.code ?? null,
      accountType: data.accountType,
      nature: data.nature,
      // Prevent circular reference: skip parentId if it equals own id
      ...(data.parentId !== id ? { parentId: data.parentId ?? null } : {}),
    })
    .where(and(eq(accountGroups.id, id), eq(accountGroups.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/account-groups`)
}

export async function deleteAccountGroup(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(accountGroups)
    .where(and(eq(accountGroups.id, id), eq(accountGroups.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/account-groups`)
}
