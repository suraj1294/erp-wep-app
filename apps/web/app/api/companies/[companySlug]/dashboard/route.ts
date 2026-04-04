import { NextResponse } from "next/server"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { company, membership } = await requireCompanyAccess(companySlug)

    return NextResponse.json({
      company,
      membership,
    })
  } catch (error) {
    return handleRouteError(error, "Failed to load dashboard data.")
  }
}
