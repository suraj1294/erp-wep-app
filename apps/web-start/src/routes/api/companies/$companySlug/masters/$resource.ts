import { createFileRoute } from "@tanstack/react-router";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

export const Route = createFileRoute("/api/companies/$companySlug/masters/$resource")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        try {
          const { companySlug, resource } = params;
          const db = await import("@workspace/db");
          if (!db.isCompanyMasterResource(resource)) {
            return errorResponse("Master resource not found.", 404);
          }

          const { requireCompanyAccess } = await import("@/lib/company-access");
          const { company } = await requireCompanyAccess(request, companySlug);
          const companyId = company.id;

          switch (resource) {
            case "account-groups": {
              const data = await db.listAccountGroups(companyId);
              return jsonResponse(data);
            }
            case "accounts": {
              const [accounts, accountGroups] = await Promise.all([
                db.listAccounts(companyId),
                db.listAccountGroupOptions(companyId),
              ]);
              return jsonResponse({ accounts, accountGroups });
            }
            case "items": {
              const [items, units] = await Promise.all([
                db.listItems(companyId),
                db.listUnitOptions(companyId),
              ]);
              return jsonResponse({ items, units });
            }
            case "parties": {
              const data = await db.listParties(companyId);
              return jsonResponse(data);
            }
            case "units": {
              const data = await db.listUnits(companyId);
              return jsonResponse(data);
            }
            case "voucher-types": {
              const data = await db.listVoucherTypes(companyId);
              return jsonResponse(data);
            }
            case "locations": {
              const data = await db.listLocations(companyId);
              return jsonResponse(data);
            }
            default:
              return errorResponse("Master resource not found.", 404);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load resource.";
          const status = message === "Unauthorized" ? 401 : message.includes("do not have access") ? 403 : 500;
          return errorResponse(status >= 500 ? "Failed to load resource." : message, status);
        }
      },
      POST: async ({ request, params }) => {
        try {
          const { companySlug, resource } = params;
          const db = await import("@workspace/db");
          if (!db.isCompanyMasterResource(resource)) {
            return errorResponse("Master resource not found.", 404);
          }

          const { requireCompanyAccess } = await import("@/lib/company-access");
          const { company } = await requireCompanyAccess(request, companySlug);
          const companyId = company.id;

          const body = await request.json();
          await db.createCompanyMasterRecord(companyId, resource, body);

          return jsonResponse({ ok: true }, 201);
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to create record.";
          const status = message === "Unauthorized" ? 401 : message.includes("do not have access") ? 403 : 500;
          return errorResponse(status >= 500 ? "Failed to create record." : message, status);
        }
      },
    },
  },
});
