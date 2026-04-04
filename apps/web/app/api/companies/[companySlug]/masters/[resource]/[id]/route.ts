import { NextResponse } from "next/server"
import {
  deleteCompanyMasterResource,
  isCompanyMasterResource,
  updateCompanyMasterResource,
} from "@/lib/company-master-api"
import { handleRouteError, jsonError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string; resource: string; id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { companySlug, resource, id } = await context.params

    if (!isCompanyMasterResource(resource)) {
      return jsonError("Master resource not found.", 404)
    }

    const body = await request.json()
    await updateCompanyMasterResource(companySlug, resource, id, body)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, "Failed to update record.")
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { companySlug, resource, id } = await context.params

    if (!isCompanyMasterResource(resource)) {
      return jsonError("Master resource not found.", 404)
    }

    await deleteCompanyMasterResource(companySlug, resource, id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, "Failed to delete record.")
  }
}
