import { NextResponse } from "next/server"
import { getVoucherDetail, updateVoucher } from "@workspace/db"
import { revalidatePath } from "next/cache"
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

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { companySlug, voucherId } = await context.params
    const { company } = await requireCompanyAccess(companySlug)
    const body = await request.json()
    const result = await updateVoucher(company.id, voucherId, body)

    revalidatePath(`/${company.slug}`)
    revalidatePath(`/${company.slug}/sales`)
    revalidatePath(`/${company.slug}/purchase`)
    revalidatePath(`/${company.slug}/banking`)
    revalidatePath(`/${company.slug}/journal`)
    revalidatePath(`/${company.slug}/credit-notes`)
    revalidatePath(`/${company.slug}/debit-notes`)

    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error, "Failed to update voucher.")
  }
}
