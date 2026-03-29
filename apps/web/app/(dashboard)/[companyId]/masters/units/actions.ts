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

export async function createUnit(companyId: string, data: UnitData) {
  await requireCompanyAccess(companyId)

  await db.insert(unitsOfMeasure).values({
    companyId,
    name: data.name,
    symbol: data.symbol,
    decimalPlaces: data.decimalPlaces,
    isBaseUnit: data.isBaseUnit,
    conversionFactor: data.conversionFactor,
  })

  revalidatePath(`/${companyId}/masters/units`)
}

export async function updateUnit(companyId: string, id: string, data: UnitData) {
  await requireCompanyAccess(companyId)

  await db
    .update(unitsOfMeasure)
    .set({
      name: data.name,
      symbol: data.symbol,
      decimalPlaces: data.decimalPlaces,
      isBaseUnit: data.isBaseUnit,
      conversionFactor: data.conversionFactor,
    })
    .where(and(eq(unitsOfMeasure.id, id), eq(unitsOfMeasure.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/units`)
}

export async function deleteUnit(companyId: string, id: string) {
  await requireCompanyAccess(companyId)

  await db
    .delete(unitsOfMeasure)
    .where(and(eq(unitsOfMeasure.id, id), eq(unitsOfMeasure.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/units`)
}
