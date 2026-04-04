import { NextResponse } from "next/server"
import { createManagedCompany } from "@/lib/company-settings-service"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const body = await request.json()
    const result = await createManagedCompany(companySlug, body)

    return NextResponse.json(result, { status: result.ok ? 201 : 400 })
  } catch (error) {
    return handleRouteError(error, "Failed to create company.")
  }
}
