import { NextResponse } from "next/server"
import { getVoucherDetail } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError, jsonError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string; voucherId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug, voucherId } = await context.params
    const { company } = await requireCompanyAccess(companySlug)
    const voucher = await getVoucherDetail(company.id, voucherId)

    if (!voucher) {
      return jsonError("Voucher not found.", 404)
    }

    return NextResponse.json(voucher)
  } catch (error) {
    return handleRouteError(error, "Failed to load voucher.")
  }
}
