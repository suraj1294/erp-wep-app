import { NextResponse } from "next/server"
import { listBankingVouchersForClass } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { company } = await requireCompanyAccess(companySlug)
    const [payments, receipts, contras] = await Promise.all([
      listBankingVouchersForClass(company.id, "payment"),
      listBankingVouchersForClass(company.id, "receipt"),
      listBankingVouchersForClass(company.id, "contra"),
    ])

    return NextResponse.json({
      companySlug: company.slug,
      payments,
      receipts,
      contras,
    })
  } catch (error) {
    return handleRouteError(error, "Failed to load banking data.")
  }
}
