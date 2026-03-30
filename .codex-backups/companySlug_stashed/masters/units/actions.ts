"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { unitsOfMeasure } from "@workspace/db/schema"
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

  await db.insert(unitsOfMeasure).values({
    companyId: company.id,
    name: data.name,
    symbol: data.symbol,
    decimalPlaces: data.decimalPlaces,
    isBaseUnit: data.isBaseUnit,
    conversionFactor: data.conversionFactor,
  })

  revalidatePath(`/${company.slug}/masters/units`)
}

export async function updateUnit(companySlug: string, id: string, data: UnitData) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .update(unitsOfMeasure)
    .set({
      name: data.name,
      symbol: data.symbol,
      decimalPlaces: data.decimalPlaces,
      isBaseUnit: data.isBaseUnit,
      conversionFactor: data.conversionFactor,
    })
    .where(and(eq(unitsOfMeasure.id, id), eq(unitsOfMeasure.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/units`)
}

export async function deleteUnit(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(unitsOfMeasure)
    .where(and(eq(unitsOfMeasure.id, id), eq(unitsOfMeasure.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/units`)
}
