import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import {
  getSampleDataSeedProgress,
  type SampleDataSeedProgress,
} from "@workspace/db"
import { companies } from "@workspace/db/schema"
import { requireCompanyAccess } from "@/lib/company-access"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  context: { params: Promise<{ companySlug: string }> }
) {
  const { companySlug } = await context.params
  const { company } = await requireCompanyAccess(companySlug)

  const [companyRow] = await db
    .select({ settings: companies.settings })
    .from(companies)
    .where(eq(companies.id, company.id))
    .limit(1)

  const settings =
    companyRow?.settings && typeof companyRow.settings === "object"
      ? (companyRow.settings as Record<string, unknown>)
      : {}

  return NextResponse.json({
    sampleDataSeeded: settings.sampleDataSeeded === true,
    progress: getSampleDataSeedProgress(
      companyRow?.settings
    ) as SampleDataSeedProgress | null,
  })
}
