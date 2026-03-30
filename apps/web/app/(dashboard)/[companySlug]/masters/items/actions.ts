"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { items } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"

interface ItemData {
  name: string
  code?: string
  description?: string
  category?: string
  unitId?: string | null
  itemType?: string
  hsnCode?: string
  taxRate?: string
  purchaseRate?: string
  salesRate?: string
  mrp?: string
}

export async function createItem(companySlug: string, data: ItemData) {
  const { company } = await requireCompanyAccess(companySlug)

  await db.insert(items).values({
    companyId: company.id,
    name: data.name,
    code: data.code ?? null,
    description: data.description ?? null,
    category: data.category ?? null,
    unitId: data.unitId ?? null,
    itemType: data.itemType ?? "goods",
    hsnCode: data.hsnCode ?? null,
    taxRate: data.taxRate ?? "0",
    purchaseRate: data.purchaseRate ?? null,
    salesRate: data.salesRate ?? null,
    mrp: data.mrp ?? null,
  })

  revalidatePath(`/${company.slug}/masters/items`)
}

export async function updateItem(
  companySlug: string,
  id: string,
  data: ItemData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .update(items)
    .set({
      name: data.name,
      code: data.code ?? null,
      description: data.description ?? null,
      category: data.category ?? null,
      unitId: data.unitId ?? null,
      itemType: data.itemType ?? "goods",
      hsnCode: data.hsnCode ?? null,
      taxRate: data.taxRate ?? "0",
      purchaseRate: data.purchaseRate ?? null,
      salesRate: data.salesRate ?? null,
      mrp: data.mrp ?? null,
    })
    .where(and(eq(items.id, id), eq(items.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/items`)
}

export async function deleteItem(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(items)
    .where(and(eq(items.id, id), eq(items.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/items`)
}
