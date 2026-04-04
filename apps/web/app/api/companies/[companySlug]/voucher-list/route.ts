import { NextResponse } from "next/server"
import { listVoucherRowsByClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError, jsonError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const voucherClass = new URL(request.url).searchParams.get("voucherClass")

    if (!voucherClass) {
      return jsonError("voucherClass is required.", 400)
    }

    const { company } = await requireCompanyAccess(companySlug)
    const rows = await listVoucherRowsByClass(company.id, voucherClass)

    return NextResponse.json({
      companySlug: company.slug,
      rows,
    })
  } catch (error) {
    return handleRouteError(error, "Failed to load voucher list.")
  }
}
