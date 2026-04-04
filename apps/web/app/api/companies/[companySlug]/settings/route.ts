import { NextResponse } from "next/server"
import {
  getCompanySettingsRecord,
  getSampleDataSeedProgress,
  listCompaniesForSettings,
  type SampleDataSeedProgress,
} from "@workspace/db"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const { session, company } = await requireCompanyAccess(companySlug)

    const rows = await listCompaniesForSettings(session.user.id)
    const currentCompanyRow = await getCompanySettingsRecord(company.id)
    const currentCompanySettings =
      currentCompanyRow?.settings &&
      typeof currentCompanyRow.settings === "object"
        ? (currentCompanyRow.settings as Record<string, unknown>)
        : {}

    return NextResponse.json({
      currentCompanySlug: company.slug,
      companies: rows.map(({ createdAt: _createdAt, ...companyRow }) => companyRow),
      sampleDataSeeded: currentCompanySettings.sampleDataSeeded === true,
      initialSampleDataSeedProgress: getSampleDataSeedProgress(
        currentCompanyRow?.settings
      ) as SampleDataSeedProgress | null,
    })
  } catch (error) {
    return handleRouteError(error, "Failed to load settings.")
  }
}
