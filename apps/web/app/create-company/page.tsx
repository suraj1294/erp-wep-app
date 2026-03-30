import { redirect } from "next/navigation"
import { asc, eq } from "drizzle-orm"
import { db } from "@workspace/db/client"
import { companyUsers, items, locations, parties, unitsOfMeasure } from "@workspace/db/schema"
import { seedCompanyDefaults } from "@workspace/db/seeds/company-defaults"
import { requireSession } from "@/lib/auth-server"
import { createCompanyRecord } from "@/lib/company-slug"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CreateCompanyWizard } from "@/components/create-company-wizard"

interface PartySeedInput {
  name: string
  displayName?: string
  type?: string
  phone?: string
  email?: string
}

interface ItemSeedInput {
  name: string
  code?: string
  salesRate?: string
  purchaseRate?: string
}

interface LocationSeedInput {
  name: string
  code?: string
  phone?: string
}

function parseJsonArray<T>(value: FormDataEntryValue | null): T[] {
  if (typeof value !== "string" || !value.trim()) {
    return []
  }

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

async function createCompanyAction(formData: FormData) {
  "use server"

  const session = await requireSession()
  const name = (formData.get("name") as string).trim()
  const displayName = (formData.get("displayName") as string | null)?.trim() || null
  const optionalParties = parseJsonArray<PartySeedInput>(formData.get("parties"))
  const optionalItems = parseJsonArray<ItemSeedInput>(formData.get("items"))
  const optionalLocations = parseJsonArray<LocationSeedInput>(
    formData.get("locations")
  )

  if (!name) throw new Error("Company name is required")

  const company = await createCompanyRecord({
    name,
    displayName,
    createdBy: session.user.id,
  })

  await db.insert(companyUsers).values({
    companyId: company.id,
    userId: session.user.id,
    role: "owner",
  })

  // Seed standard account groups, accounts, voucher types, UoM and location
  await seedCompanyDefaults(company.id)

  const [baseUnit] = await db
    .select({ id: unitsOfMeasure.id })
    .from(unitsOfMeasure)
    .where(eq(unitsOfMeasure.companyId, company.id))
    .orderBy(asc(unitsOfMeasure.isBaseUnit), asc(unitsOfMeasure.name))

  const partyRows = optionalParties
    .map((party) => ({
      companyId: company.id,
      name: party.name.trim(),
      displayName: party.displayName?.trim() || null,
      type: party.type?.trim() || "customer",
      phone: party.phone?.trim() || null,
      email: party.email?.trim() || null,
    }))
    .filter((party) => party.name)

  const itemRows = optionalItems
    .map((item) => ({
      companyId: company.id,
      name: item.name.trim(),
      code: item.code?.trim() || null,
      salesRate: item.salesRate?.trim() || null,
      purchaseRate: item.purchaseRate?.trim() || null,
      unitId: baseUnit?.id ?? null,
    }))
    .filter((item) => item.name)

  const locationRows = optionalLocations
    .map((location) => ({
      companyId: company.id,
      name: location.name.trim(),
      code: location.code?.trim() || null,
      phone: location.phone?.trim() || null,
    }))
    .filter((location) => location.name)

  if (partyRows.length > 0) {
    await db.insert(parties).values(partyRows)
  }

  if (itemRows.length > 0) {
    await db.insert(items).values(itemRows)
  }

  if (locationRows.length > 0) {
    await db.insert(locations).values(locationRows)
  }

  redirect(`/${company.slug}`)
}

export default function CreateCompanyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-[75vw]">
        <CardHeader className="text-center">
          <div className="mb-2 flex justify-center">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
              T
            </div>
          </div>
          <CardTitle className="text-2xl">Create Your Company</CardTitle>
          <CardDescription>
            Set up your first company to get started with Tally ERP
          </CardDescription>
        </CardHeader>
        <CreateCompanyWizard action={createCompanyAction} />
      </Card>
    </div>
  )
}
