import { NextResponse } from "next/server"
import { cancelVoucher } from "@workspace/db"
import { revalidatePath } from "next/cache"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string; voucherId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { companySlug, voucherId } = await context.params
    const { company } = await requireCompanyAccess(companySlug)

    await cancelVoucher(company.id, voucherId)
    revalidatePath(`/${company.slug}`)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleRouteError(error, "Failed to cancel voucher.")
  }
}
