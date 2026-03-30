"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { parties } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"

interface PartyData {
  name: string
  displayName?: string
  type: string
  contactPerson?: string
  phone?: string
  email?: string
  gstin?: string
  pan?: string
  creditLimit?: string
  creditDays?: number
}

export async function createParty(companySlug: string, data: PartyData) {
  const { company } = await requireCompanyAccess(companySlug)

  await db.insert(parties).values({
    companyId: company.id,
    name: data.name,
    displayName: data.displayName ?? null,
    type: data.type,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
    gstin: data.gstin ?? null,
    pan: data.pan ?? null,
    creditLimit: data.creditLimit ?? "0",
    creditDays: data.creditDays ?? 0,
  })

  revalidatePath(`/${company.slug}/masters/parties`)
}

export async function updateParty(
  companySlug: string,
  id: string,
  data: PartyData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .update(parties)
    .set({
      name: data.name,
      displayName: data.displayName ?? null,
      type: data.type,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      gstin: data.gstin ?? null,
      pan: data.pan ?? null,
      creditLimit: data.creditLimit ?? "0",
      creditDays: data.creditDays ?? 0,
    })
    .where(and(eq(parties.id, id), eq(parties.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/parties`)
}

export async function deleteParty(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(parties)
    .where(and(eq(parties.id, id), eq(parties.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/parties`)
}
