import { NextResponse } from "next/server"
import {
  listAccountGroupOptions,
  listAccountGroups,
  listAccounts,
  listItems,
  listLocations,
  listParties,
  listUnitOptions,
  listUnits,
  listVoucherTypes,
} from "@workspace/db"
import {
  createCompanyMasterResource,
  isCompanyMasterResource,
} from "@/lib/company-master-api"
import { requireCompanyAccess } from "@/lib/company-access"
import { handleRouteError, jsonError } from "@/lib/api-response"

interface RouteContext {
  params: Promise<{ companySlug: string; resource: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companySlug, resource } = await context.params

    if (!isCompanyMasterResource(resource)) {
      return jsonError("Master resource not found.", 404)
    }

    const { company } = await requireCompanyAccess(companySlug)

    switch (resource) {
      case "account-groups":
        return NextResponse.json(await listAccountGroups(company.id))
      case "accounts": {
        const [accounts, accountGroups] = await Promise.all([
          listAccounts(company.id),
          listAccountGroupOptions(company.id),
        ])

        return NextResponse.json({ accounts, accountGroups })
      }
      case "items": {
        const [items, units] = await Promise.all([
          listItems(company.id),
          listUnitOptions(company.id),
        ])

        return NextResponse.json({ items, units })
      }
      case "locations":
        return NextResponse.json(await listLocations(company.id))
      case "parties":
        return NextResponse.json(await listParties(company.id))
      case "units":
        return NextResponse.json(await listUnits(company.id))
      case "voucher-types":
        return NextResponse.json(await listVoucherTypes(company.id))
      default:
        return jsonError("Master resource not found.", 404)
    }
  } catch (error) {
    return handleRouteError(error, "Failed to load records.")
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { companySlug, resource } = await context.params

    if (!isCompanyMasterResource(resource)) {
      return jsonError("Master resource not found.", 404)
    }

    const body = await request.json()
    await createCompanyMasterResource(companySlug, resource, body)

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error) {
    return handleRouteError(error, "Failed to create record.")
  }
}
