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
  companyId: string,
  data: AccountGroupData
) {
  await requireCompanyAccess(companyId)

  await db.insert(accountGroups).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    accountType: data.accountType,
    nature: data.nature,
    parentId: data.parentId ?? null,
  })

  revalidatePath(`/${companyId}/masters/account-groups`)
}

export async function updateAccountGroup(
  companyId: string,
  id: string,
  data: AccountGroupData
) {
  await requireCompanyAccess(companyId)

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
    .where(and(eq(accountGroups.id, id), eq(accountGroups.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/account-groups`)
}

export async function deleteAccountGroup(companyId: string, id: string) {
  await requireCompanyAccess(companyId)

  await db
    .delete(accountGroups)
    .where(and(eq(accountGroups.id, id), eq(accountGroups.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/account-groups`)
}
