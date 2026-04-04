import { NextResponse } from "next/server"
import { getAccountVoucherFormData, getItemVoucherFormData } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError, jsonError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

const ITEM_VOUCHER_CLASSES = new Set([
  "sales",
  "purchase",
  "credit_note",
  "debit_note",
])

const ACCOUNT_VOUCHER_CLASSES = new Set([
  "payment",
  "receipt",
  "contra",
  "journal",
])

export async function GET(request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const voucherClass = new URL(request.url).searchParams.get("voucherClass")

    if (!voucherClass) {
      return jsonError("voucherClass is required.", 400)
    }

    const { company } = await requireCompanyAccess(companySlug)

    if (ITEM_VOUCHER_CLASSES.has(voucherClass)) {
      const formData = await getItemVoucherFormData(
        company.id,
        voucherClass as "sales" | "purchase" | "credit_note" | "debit_note"
      )

      return NextResponse.json({
        companyId: company.id,
        companySlug: company.slug,
        ...formData,
      })
    }

    if (ACCOUNT_VOUCHER_CLASSES.has(voucherClass)) {
      const formData = await getAccountVoucherFormData(
        company.id,
        voucherClass as "payment" | "receipt" | "contra" | "journal"
      )

      return NextResponse.json({
        companyId: company.id,
        companySlug: company.slug,
        ...formData,
      })
    }

    return jsonError("Unsupported voucherClass.", 400)
  } catch (error) {
    return handleRouteError(error, "Failed to load voucher form data.")
  }
}
