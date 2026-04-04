import { NextResponse } from "next/server"
import { getFirstActiveCompanyForUser } from "@workspace/db"
import { requireSession } from "@/lib/auth-server"
import { handleRouteError } from "@/lib/api-response"

export async function GET() {
  try {
    const session = await requireSession()
    const company = await getFirstActiveCompanyForUser(session.user.id)

    return NextResponse.json(company)
  } catch (error) {
    return handleRouteError(error, "Failed to load active company.")
  }
}
