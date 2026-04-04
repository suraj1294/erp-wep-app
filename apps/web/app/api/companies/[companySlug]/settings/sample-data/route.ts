import { NextResponse } from "next/server"
import {
  getCompanySampleDataStatus,
  seedCompanySampleData,
} from "@/lib/company-settings-service"
import { handleRouteError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string }>
}

export const dynamic = "force-dynamic"

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const result = await getCompanySampleDataStatus(companySlug)

    return NextResponse.json(result)
  } catch (error) {
    return handleRouteError(error, "Failed to load sample data status.")
  }
}

export async function POST(_request: Request, context: RouteContext) {
  try {
    const { companySlug } = await context.params
    const result = await seedCompanySampleData(companySlug)

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return handleRouteError(error, "Failed to seed sample data.")
  }
}
