"use server"

import { createUnit as createUnitRecord, deleteUnit as deleteUnitRecord, updateUnit as updateUnitRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"

interface UnitData {
  name: string
  symbol: string
  decimalPlaces: number
  isBaseUnit: boolean
  conversionFactor: string
}

export async function createUnit(companySlug: string, data: UnitData) {
  const { company } = await requireCompanyAccess(companySlug)

  await createUnitRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/units`)
}

export async function updateUnit(companySlug: string, id: string, data: UnitData) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateUnitRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/units`)
}

export async function deleteUnit(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteUnitRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/units`)
}
