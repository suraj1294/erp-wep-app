"use server"

import { createLocation as createLocationRecord, deleteLocation as deleteLocationRecord, updateLocation as updateLocationRecord } from "@workspace/db"
import { revalidatePath } from "next/cache"
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

  await createLocationRecord(company.id, data)

  revalidatePath(`/${company.slug}/masters/locations`)
}

export async function updateLocation(
  companySlug: string,
  id: string,
  data: LocationData
) {
  const { company } = await requireCompanyAccess(companySlug)

  await updateLocationRecord(company.id, id, data)

  revalidatePath(`/${company.slug}/masters/locations`)
}

export async function deleteLocation(companySlug: string, id: string) {
  const { company } = await requireCompanyAccess(companySlug)

  await deleteLocationRecord(company.id, id)

  revalidatePath(`/${company.slug}/masters/locations`)
}
