import { NextResponse } from "next/server"
import { db } from "@workspace/db/client"
import { companies, companyUsers } from "@workspace/db/schema"
import { requireSession } from "@/lib/auth-server"

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

    const result = await db
      .insert(companies)
      .values({
        name: name.trim(),
        displayName: displayName?.trim() || null,
        createdBy: session.user.id,
      })
      .returning()

    const company = result[0]!

    await db.insert(companyUsers).values({
      companyId: company.id,
      userId: session.user.id,
      role: "owner",
    })

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
