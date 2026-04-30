"use client"

import { useQuery } from "@tanstack/react-query"
import { getDashboardSnapshot } from "@/lib/api/dashboard"
import { getSampleDataStatus } from "@/lib/api/settings"
import { companyKeys } from "@/lib/query-keys"

export function useDashboardSnapshot(companySlug: string) {
  return useQuery({
    queryKey: companyKeys.dashboard(companySlug),
    queryFn: () => getDashboardSnapshot(companySlug),
  })
}

export function useSampleDataStatus(companySlug: string) {
  return useQuery({
    queryKey: companyKeys.sampleData(companySlug),
    queryFn: () => getSampleDataStatus(companySlug),
  })
}
