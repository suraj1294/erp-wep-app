import { NextResponse } from "next/server"
import { requireSession } from "@/lib/auth-server"
import { createCompanyForUser } from "@/lib/company-creation"
import { handleRouteError, jsonError } from "@/lib/api-response"

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const { name, displayName, parties, items, locations, seedDefaults } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return jsonError("Company name is required", 400)
    }

    const company = await createCompanyForUser(session.user.id, {
      name,
      displayName,
      parties,
      items,
      locations,
      seedDefaults: seedDefaults === true,
    })

    return NextResponse.json(company)
  } catch (error) {
    return handleRouteError(error, "Failed to create company.")
  }
}
