"use server"

import { eq, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@workspace/db/client"
import { locations } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"

interface LocationData {
  name: string
  code?: string
  address?: string
  contactPerson?: string
  phone?: string
  isDefault?: boolean
}

export async function createLocation(companyId: string, data: LocationData) {
  await requireCompanyAccess(companyId)

  await db.insert(locations).values({
    companyId,
    name: data.name,
    code: data.code ?? null,
    address: data.address ?? null,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    isDefault: data.isDefault ?? false,
  })

  revalidatePath(`/${companyId}/masters/locations`)
}

export async function updateLocation(
  companyId: string,
  id: string,
  data: LocationData
) {
  await requireCompanyAccess(companyId)

  await db
    .update(locations)
    .set({
      name: data.name,
      code: data.code ?? null,
      address: data.address ?? null,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone ?? null,
      isDefault: data.isDefault ?? false,
    })
    .where(and(eq(locations.id, id), eq(locations.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/locations`)
}

export async function deleteLocation(companyId: string, id: string) {
  await requireCompanyAccess(companyId)

  await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.companyId, companyId)))

  revalidatePath(`/${companyId}/masters/locations`)
}
