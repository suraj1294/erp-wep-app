import type { CompanyDashboardPayload } from "@/lib/server-api"
import { apiRequest } from "@/lib/api-client"

export function getDashboardSnapshot(companySlug: string) {
  return apiRequest<CompanyDashboardPayload>(
    `/api/companies/${encodeURIComponent(companySlug)}/dashboard`
  )
}
