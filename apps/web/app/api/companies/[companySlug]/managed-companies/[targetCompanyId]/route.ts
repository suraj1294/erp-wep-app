import { NextResponse } from "next/server"
import {
  disableManagedCompanySettings,
  updateManagedCompanySettings,
} from "@/lib/company-settings-service"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string; targetCompanyId: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { companySlug, targetCompanyId } = await context.params
    const body = await request.json()
    const result = await updateManagedCompanySettings(
      companySlug,
      targetCompanyId,
      body
    )

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return handleRouteError(error, "Failed to update company.")
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { companySlug, targetCompanyId } = await context.params
    const result = await disableManagedCompanySettings(
      companySlug,
      targetCompanyId
    )

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return handleRouteError(error, "Failed to disable company.")
  }
}
