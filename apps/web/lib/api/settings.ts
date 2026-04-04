import type { SampleDataSeedProgress } from "@workspace/db"
import { apiRequest } from "@/lib/api-client"

export type SettingsActionResult = {
  ok: boolean
  message: string
  redirectCompanySlug?: string
  companyId?: string
  companySlug?: string
  sampleDataSeedProgress?: SampleDataSeedProgress | null
}

export function createCompanyFromSettings(
  currentCompanySlug: string,
  input: {
    name: string
    displayName?: string
  }
) {
  return apiRequest<SettingsActionResult>(
    `/api/companies/${encodeURIComponent(currentCompanySlug)}/managed-companies`,
    {
      method: "POST",
      body: JSON.stringify(input),
    }
  )
}

export function updateManagedCompany(
  currentCompanySlug: string,
  targetCompanyId: string,
  input: {
    name: string
    displayName?: string
    email?: string
    phone?: string
    gstin?: string
    pan?: string
  }
) {
  return apiRequest<SettingsActionResult>(
    `/api/companies/${encodeURIComponent(
      currentCompanySlug
    )}/managed-companies/${encodeURIComponent(targetCompanyId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    }
  )
}

export function disableManagedCompany(
  currentCompanySlug: string,
  targetCompanyId: string
) {
  return apiRequest<SettingsActionResult>(
    `/api/companies/${encodeURIComponent(
      currentCompanySlug
    )}/managed-companies/${encodeURIComponent(targetCompanyId)}`,
    {
      method: "DELETE",
    }
  )
}

export function seedSampleDataAction(companySlug: string) {
  return apiRequest<SettingsActionResult>(
    `/api/companies/${encodeURIComponent(companySlug)}/settings/sample-data`,
    {
      method: "POST",
    }
  )
}

export function getSampleDataStatus(companySlug: string) {
  return apiRequest<{
    sampleDataSeeded: boolean
    progress: SampleDataSeedProgress | null
  }>(`/api/companies/${encodeURIComponent(companySlug)}/settings/sample-data`, {
    cache: "no-store",
  })
}
