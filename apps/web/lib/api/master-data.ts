import { apiRequest } from "@/lib/api-client"
import type { MasterResource } from "@/lib/query-keys"

export function getMasterResource<T = unknown[]>(
  companySlug: string,
  resource: MasterResource
) {
  return apiRequest<T>(
    `/api/companies/${encodeURIComponent(companySlug)}/masters/${resource}`
  )
}
