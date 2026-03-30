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

export async function createAccount(companySlug: string, data: AccountData) {
  const { company } = await requireCompanyAccess(companySlug)

  await db.insert(accounts).values({
    companyId: company.id,
    name: data.name,
    code: data.code ?? null,
    description: data.description ?? null,
    groupId: data.groupId ?? null,
    openingBalance: data.openingBalance ?? "0",
  })

  revalidatePath(`/${company.slug}/masters/accounts`)
}

export async function updateAccount(
  companySlug: string,
  id: string,
  data: AccountData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .update(accounts)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      groupId: data.groupId ?? null,
      openingBalance: data.openingBalance ?? "0",
    })
    .where(and(eq(accounts.id, id), eq(accounts.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/accounts`)
}

export async function deleteAccount(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(accounts)
    .where(and(eq(accounts.id, id), eq(accounts.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/accounts`)
}
