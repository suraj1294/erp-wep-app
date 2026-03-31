"use server"

import { createParty as createPartyRecord, deleteParty as deletePartyRecord, updateParty as updatePartyRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
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

  await createPartyRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/parties`)
}

export async function updateParty(
  companySlug: string,
  id: string,
  data: PartyData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updatePartyRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/parties`)
}

export async function deleteParty(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deletePartyRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/parties`)
}
