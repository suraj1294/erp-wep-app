import { createFileRoute } from "@tanstack/react-router"
import {
  isCompanyMasterResource,
  listAccountGroups,
  listAccounts,
  listVoucherTypes,
  listParties,
  listItems,
  listUnits,
  listLocations,
  listAccountGroupOptions,
  listUnitOptions,
} from "@workspace/db"
import { requireCompanyAccess } from "#/lib/company-access"

const RESOURCE_LISTERS: Record<string, (companyId: string) => Promise<unknown>> = {
  "account-groups": listAccountGroups,
  accounts: listAccounts,
  "voucher-types": listVoucherTypes,
  parties: listParties,
  items: listItems,
  units: listUnits,
  locations: listLocations,
}

const RESOURCE_OPTIONS: Record<string, (companyId: string) => Promise<unknown>> = {
  accounts: listAccountGroupOptions,
  items: listUnitOptions,
}

export const Route = createFileRoute("/api/companies/$companySlug/masters/$resource")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { companySlug, resource } = params as { companySlug: string; resource: string }

        if (!isCompanyMasterResource(resource)) {
          return new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: { "content-type": "application/json" },
          })
        }

        try {
          const { company } = await requireCompanyAccess(request, companySlug)
          const lister = RESOURCE_LISTERS[resource]
          if (!lister) {
            return new Response(JSON.stringify({ error: "Not found" }), {
              status: 404,
              headers: { "content-type": "application/json" },
            })
          }

          const data = await lister(company.id)

          // Include options if available for this resource
          const optionsLifter = RESOURCE_OPTIONS[resource]
          if (optionsLifter) {
            const options = await optionsLifter(company.id)
            return new Response(JSON.stringify({ data, options }), {
              headers: { "content-type": "application/json" },
            })
          }

          return new Response(JSON.stringify({ data }), {
            headers: { "content-type": "application/json" },
          })
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load resource."
          const status = message === "Unauthorized" ? 401 :
            message.includes("do not have access") ? 403 :
            message.includes("not found") ? 404 : 500
          return new Response(JSON.stringify({ error: message }), {
            status,
            headers: { "content-type": "application/json" },
          })
        }
      },
    },
  },
})