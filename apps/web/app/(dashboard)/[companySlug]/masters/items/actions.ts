"use server"

import { createItem as createItemRecord, deleteItem as deleteItemRecord, updateItem as updateItemRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
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

  await createItemRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/items`)
}

export async function updateItem(
  companySlug: string,
  id: string,
  data: ItemData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateItemRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/items`)
}

export async function deleteItem(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteItemRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/items`)
}
