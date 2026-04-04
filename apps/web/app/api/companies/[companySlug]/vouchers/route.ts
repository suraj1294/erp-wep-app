import { NextResponse } from "next/server"
import { createVoucher, getVouchersByClass } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { company } = await requireCompanyAccess(companySlug)
    const { searchParams } = new URL(request.url)
    const voucherClasses = searchParams
      .get("voucherClasses")
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean)

    const rows = await getVouchersByClass(company.id, voucherClasses ?? [])

    return NextResponse.json(rows)
  } catch (error) {
    return handleRouteError(error, "Failed to load vouchers.")
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { session, company } = await requireCompanyAccess(companySlug)
    const body = await request.json()
    const result = await createVoucher(company.id, session.user.id, body)

    revalidatePath(`/${company.slug}`)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "Failed to create voucher.")
  }
}
