import { NextResponse } from "next/server"
import { addCompanyOwnerMembership } from "@workspace/db"
import { requireSession } from "@/lib/auth-server"
import { createCompanyRecord } from "@/lib/company-slug"

export async function POST(request: Request) {
  try {
    const session = await requireSession()
    const body = await request.json()
    const { name, displayName } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      )
    }

    const company = await createCompanyRecord({
      name,
      displayName,
      createdBy: session.user.id,
    })

    await addCompanyOwnerMembership(company.id, session.user.id)

    return NextResponse.json(company)
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    )
  }
}
