"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { accounts } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"

interface AccountData {
  name: string
  code?: string
  description?: string
  groupId?: string | null
  openingBalance?: string
}

export async function createAccount(companyId: string, data: AccountData) {
  await requireCompanyAccess(companyId)

  await db.insert(accounts).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    description: data.description ?? null,
    groupId: data.groupId ?? null,
    openingBalance: data.openingBalance ?? "0",
  })

  revalidatePath(`/${companyId}/masters/accounts`)
}

export async function updateAccount(
  companyId: string,
  id: string,
  data: AccountData
) {
  await requireCompanyAccess(companyId)

  await db
    .update(accounts)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      groupId: data.groupId ?? null,
      openingBalance: data.openingBalance ?? "0",
    })
    .where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/accounts`)
}

export async function deleteAccount(companyId: string, id: string) {
  await requireCompanyAccess(companyId)

  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/accounts`)
}
