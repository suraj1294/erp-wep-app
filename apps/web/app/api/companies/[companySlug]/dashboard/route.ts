import { NextResponse } from "next/server"
import { requireCompanyAccess } from "@/lib/company-access"
import { getCompanyDashboardSnapshot } from "@/lib/dashboard-data"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { company, membership } = await requireCompanyAccess(companySlug)
    const dashboard = await getCompanyDashboardSnapshot(company.id, company.slug)

    return NextResponse.json({
      company,
      membership,
      ...dashboard,
    })
  } catch (error) {
    return handleRouteError(error, "Failed to load dashboard data.")
  }
}
