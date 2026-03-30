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

export async function createLocation(companySlug: string, data: LocationData) {
  const { company } = await requireCompanyAccess(companySlug)

  await db.insert(locations).values({
    companyId: company.id,
    name: data.name,
    code: data.code ?? null,
    address: data.address ?? null,
    contactPerson: data.contactPerson ?? null,
    phone: data.phone ?? null,
    isDefault: data.isDefault ?? false,
  })

  revalidatePath(`/${company.slug}/masters/locations`)
}

export async function updateLocation(
  companySlug: string,
  id: string,
  data: LocationData
) {
  const { company } = await requireCompanyAccess(companySlug)

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
    .where(and(eq(locations.id, id), eq(locations.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/locations`)
}

export async function deleteLocation(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await db
    .delete(locations)
    .where(and(eq(locations.id, id), eq(locations.companyId, company.id)))

  revalidatePath(`/${company.slug}/masters/locations`)
}
