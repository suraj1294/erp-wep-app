import {
  addCompanyOwnerMembership,
  seedCompanyMasters,
  seedCompanyDefaults,
} from "@workspace/db"
import { createCompanyRecord } from "@/lib/company-slug"

export interface PartySeedInput {
  name: string
  displayName?: string
  type?: string
  phone?: string
  email?: string
}

export interface ItemSeedInput {
  name: string
  code?: string
  salesRate?: string
  purchaseRate?: string
}

export interface LocationSeedInput {
  name: string
  code?: string
  phone?: string
}

export interface CreateCompanyPayload {
  name: string
  displayName?: string | null
  parties?: PartySeedInput[]
  items?: ItemSeedInput[]
  locations?: LocationSeedInput[]
  seedDefaults?: boolean
}

export async function createCompanyForUser(
  userId: string,
  input: CreateCompanyPayload
) {
  const name = input.name.trim()
  const displayName = input.displayName?.trim() || null

  if (!name) {
    throw new Error("Company name is required")
  }

  const company = await createCompanyRecord({
    name,
    displayName,
    createdBy: userId,
  })

  await addCompanyOwnerMembership(company.id, userId)

  if (input.seedDefaults) {
    await seedCompanyDefaults(company.id)
  }

  const parties = input.parties ?? []
  const items = input.items ?? []
  const locations = input.locations ?? []

  if (parties.length > 0 || items.length > 0 || locations.length > 0) {
    await seedCompanyMasters(company.id, {
      parties,
      items,
      locations,
    })
  }

  return company
}
