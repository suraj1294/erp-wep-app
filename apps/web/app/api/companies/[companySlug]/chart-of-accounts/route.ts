import { NextResponse } from "next/server"
import { listAccountGroups, listAccounts } from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { company } = await requireCompanyAccess(companySlug)
    const [groups, accounts] = await Promise.all([
      listAccountGroups(company.id),
      listAccounts(company.id),
    ])

    return NextResponse.json({ groups, accounts })
  } catch (error) {
    return handleRouteError(error, "Failed to load chart of accounts.")
  }
}
