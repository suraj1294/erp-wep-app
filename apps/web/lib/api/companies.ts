import { apiRequest } from "@/lib/api-client"

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

export interface CreateCompanyInput {
  name: string
  displayName?: string
  parties?: PartySeedInput[]
  items?: ItemSeedInput[]
  locations?: LocationSeedInput[]
  seedDefaults?: boolean
}

interface CompanyResponse {
  id: string
  slug: string
  name: string
  displayName: string | null
}

export function createCompany(input: CreateCompanyInput) {
  return apiRequest<CompanyResponse>("/api/companies", {
    method: "POST",
    body: JSON.stringify(input),
  })
}
