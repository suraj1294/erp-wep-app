import { NextResponse } from "next/server"
import { listActiveCompaniesForUser } from "@workspace/db"
import { requireSession } from "@/lib/auth-server"
import { handleRouteError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await requireSession()
    const companies = await listActiveCompaniesForUser(session.user.id)

    return NextResponse.json(companies)
  } catch (error) {
    return handleRouteError(error, "Failed to load companies.")
  }
}
